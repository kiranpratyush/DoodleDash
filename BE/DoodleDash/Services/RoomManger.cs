using System.Collections.Concurrent;
using System.Diagnostics;
using DoodleDash.Hubs;
using DoodleDash.Models;
using DoodleDash.Utils;
using Microsoft.AspNetCore.SignalR;

namespace DoodleDash.Services
{
    class RoomManager : IRoomManager
    {
        private readonly ConcurrentDictionary<string, GameRoom> Rooms = new();
        private readonly ConcurrentDictionary<string, List<List<float>>> CanvasHistory = new();
        private readonly ConcurrentDictionary<string, object> roomLocks = new();



        private readonly IHubContext<DoodleDashHub> hubContext;

        public RoomManager(IHubContext<DoodleDashHub> hubContext)
        {
            this.hubContext = hubContext;

        }

        private object GetRoomLock(string roomCode) =>
            roomLocks.GetOrAdd(roomCode, _ => new object());

        public GameRoom? CreateRoom(CreateRoomRequest roomRequest)
        {
            int retryCount = 0;
            int MAX_RETRY_COUNT = 3;
            while (retryCount < MAX_RETRY_COUNT)
            {
                var roomCode = CodeGenerator.Generate();
                var hostId = Guid.NewGuid().ToString();
                var words = roomRequest.CustomWords.Count > 0
                    ? roomRequest.CustomWords
                    : DefaultWords.GetRandomWords(30);
                var room = new GameRoom
                {
                    HostId = hostId,
                    HostName = roomRequest.PlayerName,
                    RoomCode = roomCode,
                    MaxPlayerCount = roomRequest.MaxAllowedPlayers,
                    CustomWords = words,
                };
                if (Rooms.TryAdd(roomCode, room)) return room;
                retryCount++;
            }
            return null;
        }

        public RoomSnapShotResponse TryAddPlayer(string roomCode, string playerName,string connectionId, string?playerId)
        {
            var roomResponse = new RoomSnapShotResponse();

            if (!Rooms.TryGetValue(roomCode, out GameRoom? room))
            {
                roomResponse.ErrorMessage = "Room not found";
                roomResponse.Success = false;
            }

            lock (GetRoomLock(roomCode))
            {
                if (!Rooms.TryGetValue(roomCode, out room))
                {
                    roomResponse.ErrorMessage = "Room not found";
                    roomResponse.Success = false;
                }
                else if (room != null && (room.IsExpired || room.Players.Count >= room.MaxPlayerCount))
                {
                    roomResponse.ErrorMessage = "Room is full or expired";
                    roomResponse.Success = false;
                }
                else if (playerId != null && room != null && !room.Players.ContainsKey(playerId))
                {
                    roomResponse.ErrorMessage = "Player does not exist in current room";
                    roomResponse.Success = false;
                }
                else
                {
                    playerId ??= Guid.NewGuid().ToString();
                    var player = new Player
                    {
                        Id = playerId,
                        Name = playerName,
                        Score = 0,
                        ConnectionId = connectionId

                    };
                    if (!room!.Players.TryAdd(player.Id, player))
                    {
                        roomResponse.ErrorMessage = "Failed to add player to room";
                        roomResponse.Success = false;
                    }
                    roomResponse.Player = player;
                    roomResponse.SnapShotResponse = new GameSnapShotResponse
                    {
                        LobbyMessage = room.LobbyMessage,
                        RoundNumber = room.CurrentRound,
                        DrawData = CanvasHistory.GetOrAdd(roomCode, _ => new List<List<float>>()),
                        ChatMessages = room.ChatMessages,
                        RoundEndTime = room.RoundEndTime,
                        Players = [.. room.Players.Values],
                        CurrentWordHint = room.CurrentWordHint
                    };
                }

            }
            return roomResponse;
        }

        public async Task StartGame(string roomCode)
        {
            List<string> wordOptions = [];
            if(!Rooms.TryGetValue(roomCode, out GameRoom? room))
                return;
            lock (GetRoomLock(roomCode))
            {
                if(!Rooms.TryGetValue(roomCode, out room))
                    return;
                if (room.Players.Count < 2 || room.Status != GameStatus.Lobby)
                    return;
                wordOptions = SendChooseWord(room);
            }
           
            if(room!=null && room.ActivePlayer != null)
            {
               await hubContext.Clients.Client(room.ActivePlayer.ConnectionId).SendAsync("StartWordSelection", wordOptions);
               await hubContext.Clients.GroupExcept(roomCode,room.ActivePlayer.ConnectionId).SendAsync("GameStarted", room.ActivePlayer.Id, room.ActivePlayer.Name);
            }      
        }

        private static List<string> SendChooseWord(GameRoom room)
        {
            IEnumerable<string> wordOptions;
            wordOptions = Random.Shared.GetItems(room.CustomWords.ToArray(), 3);
            var randomPlayer = room.Players.Values.ElementAt(Random.Shared.Next(room.Players.Count));
            room.ActivePlayer = randomPlayer;
            return wordOptions.ToList();
        }

        public bool TryRemovePlayer(string roomCode, string playerId)
        {
            if (!Rooms.TryGetValue(roomCode, out GameRoom? room))
                return false;

            lock (GetRoomLock(roomCode))
            {
                if (!Rooms.TryGetValue(roomCode, out room))
                    return false;

                Player? removed;
                return room.Players.TryRemove(playerId, out removed);
            }
        }

        
    }
}