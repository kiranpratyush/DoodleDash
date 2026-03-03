using System.Collections.Concurrent;
using DoodleDash.Models;
using DoodleDash.Utils;

namespace DoodleDash.Services
{
    class RoomManager : IRoomManager
    {
        private ConcurrentDictionary<string, GameRoom> rooms = new();
        private ConcurrentDictionary<string, ConcurrentQueue<DrawAction>> canvasHistory = new();
        private ConcurrentDictionary<string, object> roomLocks = new();

        private object GetRoomLock(string roomCode) =>
            roomLocks.GetOrAdd(roomCode, _ => new object());

        public bool TryAddPlayer(string roomCode, Player p)
        {
            if (!rooms.TryGetValue(roomCode, out GameRoom? room))
                return false;

            lock (GetRoomLock(roomCode))
            {
                if (!rooms.TryGetValue(roomCode, out room))
                    return false;

                if (room.IsExpired || room.Players.Count >= room.MaxPlayerCount)
                    return false;

                if (room.Players.Any(existing => existing.Id == p.Id))
                    return false;

                room.Players.Add(p);
                return true;
            }
        }
        public GameRoom? CreateRoom(CreateRoomRequest roomRequest)
        {
            int retryCount = 0;
            int MAX_RETRY_COUNT = 3;
            while (retryCount < MAX_RETRY_COUNT)
            {
                var roomCode = CodeGenerator.Generate();
                var hostId = Guid.NewGuid().ToString();
                var room = new GameRoom
                {
                    HostId = hostId,
                    HostName = roomRequest.HostName,
                    RoomCode = roomCode,
                    RoomName = roomRequest.RoomName,
                    MaxPlayerCount = roomRequest.MaxPlayerCount,
                };
                if (rooms.TryAdd(roomCode, room)) return room;
                retryCount++;

            }
            return null;
        }

        public GameRoom? GetGameRoom(string roomCode)
        {
            rooms.TryGetValue(roomCode, out GameRoom? room);
            return room;
        }
    }
}