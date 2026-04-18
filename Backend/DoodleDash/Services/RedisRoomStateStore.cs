using System.Text.Json;
using System.Text.Json.Serialization;
using DoodleDash.Models;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace DoodleDash.Services
{
    public class RedisRoomStateStore : IRoomStateStore
    {
        private readonly IDatabase database;
        private readonly RedisRoomOptions options;
        private readonly JsonSerializerOptions serializerOptions = new()
        {
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        public RedisRoomStateStore(IConnectionMultiplexer multiplexer, IOptions<RedisRoomOptions> options)
        {
            database = multiplexer.GetDatabase();
            this.options = options.Value;
        }

        public IRoomLockHandle? AcquireRoomLock(string roomCode)
        {
            var lockKey = GetRoomLockKey(roomCode);
            var lockToken = Guid.NewGuid().ToString("N");
            var acquired = database.LockTake(lockKey, lockToken, TimeSpan.FromSeconds(options.LockTimeoutSeconds));
            if (!acquired)
            {
                return null;
            }

            return new RedisRoomLockHandle(database, lockKey, lockToken);
        }

        public bool TryCreateRoom(GameRoom room)
        {
            var roomKey = GetRoomKey(room.RoomCode);
            var payload = Serialize(room);
            var created = database.StringSet(roomKey, payload, GetRoomTtl(), When.NotExists);
            if (!created)
            {
                return false;
            }

            SavePlayerRoom(room.HostId, room.RoomCode);
            return true;
        }

        public GameRoom? GetRoom(string roomCode)
        {
            var payload = database.StringGet(GetRoomKey(roomCode));
            if (payload.IsNullOrEmpty)
            {
                return null;
            }

            var room = JsonSerializer.Deserialize<GameRoom>(payload.ToString(), serializerOptions);
            if (room != null)
            {
                RefreshRoomExpiry(room.RoomCode);
            }

            return room;
        }

        public void SaveRoom(GameRoom room)
        {
            database.StringSet(GetRoomKey(room.RoomCode), Serialize(room), GetRoomTtl());
            foreach (var player in room.Players.Values)
            {
                SavePlayerRoom(player.Id, room.RoomCode);
            }
        }

        public RoomStateStoreAddPlayerResult TryAddOrReconnectPlayer(string roomCode, string playerName, string connectionId, string? playerId)
        {
            return WithRoomLock(roomCode, () =>
            {
                var room = GetRoomWithoutTouch(roomCode);
                if (room == null)
                {
                    return new RoomStateStoreAddPlayerResult
                    {
                        Success = false,
                        ErrorMessage = "Room not found"
                    };
                }

                if (room.IsExpired)
                {
                    return new RoomStateStoreAddPlayerResult
                    {
                        Success = false,
                        ErrorMessage = "Room is full or expired"
                    };
                }

                if (!string.IsNullOrWhiteSpace(playerId) &&
                    room.Players.TryGetValue(playerId, out var existingPlayer))
                {
                    existingPlayer.ConnectionId = connectionId;
                    SaveRoom(room);
                    return new RoomStateStoreAddPlayerResult
                    {
                        Success = true,
                        Player = existingPlayer,
                        Room = room,
                        IsReconnect = true
                    };
                }

                if (!string.IsNullOrWhiteSpace(playerId))
                {
                    return new RoomStateStoreAddPlayerResult
                    {
                        Success = false,
                        ErrorMessage = "Player does not exist in current room"
                    };
                }

                if (room.Players.Count >= room.MaxPlayerCount)
                {
                    return new RoomStateStoreAddPlayerResult
                    {
                        Success = false,
                        ErrorMessage = "Room is full or expired"
                    };
                }

                var newPlayer = new Player
                {
                    Id = Guid.NewGuid().ToString(),
                    Name = playerName,
                    Score = 0,
                    ConnectionId = connectionId
                };

                if (room.Players.ContainsKey(newPlayer.Id))
                {
                    return new RoomStateStoreAddPlayerResult
                    {
                        Success = false,
                        ErrorMessage = "Failed to add player to room"
                    };
                }

                room.Players[newPlayer.Id] = newPlayer;
                SaveRoom(room);
                return new RoomStateStoreAddPlayerResult
                {
                    Success = true,
                    Player = newPlayer,
                    Room = room
                };
            }, () => new RoomStateStoreAddPlayerResult
            {
                Success = false,
                ErrorMessage = "Room is busy"
            });
        }

        public Player? TryRemovePlayer(string roomCode, string playerId)
        {
            return WithRoomLock(roomCode, () =>
            {
                var room = GetRoomWithoutTouch(roomCode);
                if (room == null)
                {
                    return null;
                }

                if (!room.Players.Remove(playerId, out var removedPlayer))
                {
                    return null;
                }

                database.KeyDelete(GetPlayerRoomKey(playerId));

                if (room.Players.Count == 0)
                {
                    database.KeyDelete(GetRoomKey(roomCode));
                    return removedPlayer;
                }

                SaveRoom(room);
                return removedPlayer;
            }, () => null);
        }

        private T WithRoomLock<T>(string roomCode, Func<T> action, Func<T> onLockUnavailable)
        {
            using var roomLock = AcquireRoomLock(roomCode);
            if (roomLock == null)
            {
                return onLockUnavailable();
            }

            return action();
        }

        private void SavePlayerRoom(string playerId, string roomCode)
        {
            database.StringSet(GetPlayerRoomKey(playerId), roomCode, GetRoomTtl());
        }

        private void RefreshRoomExpiry(string roomCode)
        {
            database.KeyExpire(GetRoomKey(roomCode), GetRoomTtl());
        }

        private GameRoom? GetRoomWithoutTouch(string roomCode)
        {
            var payload = database.StringGet(GetRoomKey(roomCode));
            if (payload.IsNullOrEmpty)
            {
                return null;
            }

            return JsonSerializer.Deserialize<GameRoom>(payload.ToString(), serializerOptions);
        }

        private TimeSpan GetRoomTtl() => TimeSpan.FromMinutes(options.RoomTtlMinutes);

        private string Serialize(GameRoom room) => JsonSerializer.Serialize(room, serializerOptions);

        private string GetRoomKey(string roomCode) => $"{options.KeyPrefix}:room:{roomCode}:state";

        private string GetPlayerRoomKey(string playerId) => $"{options.KeyPrefix}:player:{playerId}:room";

        private string GetRoomLockKey(string roomCode) => $"{options.KeyPrefix}:lock:room:{roomCode}";

        private sealed class RedisRoomLockHandle : IRoomLockHandle
        {
            private readonly IDatabase database;
            private readonly string lockKey;
            private readonly string lockToken;
            private bool disposed;

            public RedisRoomLockHandle(IDatabase database, string lockKey, string lockToken)
            {
                this.database = database;
                this.lockKey = lockKey;
                this.lockToken = lockToken;
            }

            public void Dispose()
            {
                if (disposed)
                {
                    return;
                }

                database.LockRelease(lockKey, lockToken);
                disposed = true;
            }
        }
    }
}
