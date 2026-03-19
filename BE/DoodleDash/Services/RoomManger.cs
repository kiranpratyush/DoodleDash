using DoodleDash.Hubs;
using DoodleDash.Models;
using DoodleDash.Utils;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace DoodleDash.Services
{
    partial class RoomManager : IRoomManager
    {
        private readonly ConcurrentDictionary<string, GameRoom> Rooms = new();
        private readonly ConcurrentDictionary<string, List<List<float>>> CanvasHistory = new();
        private readonly ConcurrentDictionary<string, object> roomLocks = new();
        private readonly IHubContext<DoodleDashHub> hubContext;
        private const int DefaultWordSelectionSeconds = 20;

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
                    Status = GameStatus.Lobby,
                    HostId = hostId,
                    HostName = roomRequest.PlayerName,
                    RoomCode = roomCode,
                    MaxPlayerCount = roomRequest.MaxAllowedPlayers,
                    CustomWords = words,
                    TotalRounds = (int)roomRequest.TotalRounds,
                    DrawTimeSeconds = roomRequest.DrawTimeSeconds,
                    WordSelectionSeconds = DefaultWordSelectionSeconds
                };
                if (Rooms.TryAdd(roomCode, room)) return room;
                retryCount++;
            }
            return null;
        }

        public RoomSnapShotResponse TryAddPlayer(string roomCode, string playerName, string connectionId, string? playerId)
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
                else if (playerId != null && room != null && room.HostId != playerId)
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
                    else
                    {
                        roomResponse.Success = true;
                    }
                    roomResponse.Player = player;
                    var snapshot = new GameSnapShotResponse
                    {
                        Status = room.Status,
                        LobbyMessage = room.LobbyMessage,
                        RoundNumber = room.CurrentRound,
                        TotalRounds = room.TotalRounds,
                        DrawTimeSeconds = room.DrawTimeSeconds,
                        ChatMessages = room.ChatMessages,
                        Players = [.. room.Players.Values],
                        ActivePlayer = room.ActivePlayer
                    };

                    if (room.Status == GameStatus.SelectingWord)
                    {
                        snapshot.SelectionEndTime = room.SelectionEndTime;
                    }
                    else if (room.Status == GameStatus.Drawing)
                    {
                        snapshot.RoundEndTime = room.RoundEndTime;
                        snapshot.CurrentWordHint = room.CurrentWordHint;
                        snapshot.DrawData = CanvasHistory.GetOrAdd(roomCode, _ => new List<List<float>>());
                    }
                    else if (room.Status == GameStatus.RoundEnded)
                    {
                        snapshot.LastRoundResult = room.LastRoundResult;
                    }
                    else if (room.Status == GameStatus.GameEnded)
                    {
                        snapshot.FinalResult = room.FinalResult;
                    }

                    roomResponse.SnapShotResponse = snapshot;
                }

            }
            return roomResponse;
        }

        public async Task StartGame(string roomCode)
        {
            List<string> wordOptions = [];
            string? selectionEndTime = null;
            if (!Rooms.TryGetValue(roomCode, out GameRoom? room))
                return;
            lock (GetRoomLock(roomCode))
            {
                if (!Rooms.TryGetValue(roomCode, out room))
                    return;
                if (room.Players.Count < 2 || room.Status != GameStatus.Lobby)
                    return;
                room.Status = GameStatus.SelectingWord;
                room.SelectionEndTime = DateTime.UtcNow.AddSeconds(room.WordSelectionSeconds).ToString("o");
                room.LastRoundResult = null;
                room.FinalResult = null;
                wordOptions = SendChooseWord(room);
                selectionEndTime = room.SelectionEndTime;
            }

            if (room != null && room.ActivePlayer != null)
            {
                await hubContext.Clients.Client(room.ActivePlayer.ConnectionId).SendAsync("StartWordSelection", wordOptions, room.DrawTimeSeconds);
                await hubContext.Clients.GroupExcept(roomCode, room.ActivePlayer.ConnectionId).SendAsync("GameStarted", room.ActivePlayer.Id, room.ActivePlayer.Name, room.DrawTimeSeconds);
            }
            if (selectionEndTime != null)
            {
                _ = ScheduleSelectionTimeout(roomCode, DateTime.Now.AddSeconds(5000).ToUniversalTime().ToString());
            }
        }

        public Player? TryRemovePlayer(string roomCode, string playerId)
        {
            if (!Rooms.TryGetValue(roomCode, out GameRoom? room))
                return null;

            lock (GetRoomLock(roomCode))
            {
                if (!Rooms.TryGetValue(roomCode, out room))
                    return null;

                Player? removed;
                if (room.Players.TryRemove(playerId, out removed))
                {
                    return removed;
                }
                return null;
            }
        }

        public async Task OnRoundOver(string roomCode)
        {
            if (!Rooms.TryGetValue(roomCode, out GameRoom? room))
            {
                return;
            }
            if (room == null || room.IsExpired)
            {
                return;
            }

            RoundOverResponse response = new() { };
            string? activePlayerConnectionId = null;
            List<string>? wordOptions = null;
            string? activePlayerId = null;
            string? activePlayerName = null;
            bool shouldStartNextRound = false;
            bool shouldEndGame = false;

            lock (GetRoomLock(roomCode))
            {
                if (!Rooms.TryGetValue(roomCode, out room) || room == null || room.IsExpired)
                {
                    return;
                }

                room.Status = GameStatus.RoundEnded;
                response.Success = true;
                response.RoundNumber = room.CurrentRound;
                response.CorrectWord = room.CurrentWord ?? "";
                foreach (var player in room.Players.Values)
                {
                    response.Players.Add(player);
                }
                room.LastRoundResult = response;
            }
            await hubContext.Clients.Group(roomCode).SendAsync("RoundOver", response);

            await Task.Delay(5000);

            lock (GetRoomLock(roomCode))
            {
                if (!Rooms.TryGetValue(roomCode, out room) || room == null || room.IsExpired)
                {
                    return;
                }

                if (room.CurrentRound < room.TotalRounds)
                {
                    room.CurrentRound++;
                    room.Status = GameStatus.SelectingWord;
                    room.CurrentWord = null;
                    room.CurrentWordHint = null;
                    room.SelectionEndTime = DateTime.UtcNow.AddSeconds(room.WordSelectionSeconds).ToString("o");
                    room.LastRoundResult = null;

                    CanvasHistory.TryRemove(roomCode, out _);

                    wordOptions = SendChooseWord(room);
                    activePlayerConnectionId = room.ActivePlayer?.ConnectionId;
                    activePlayerId = room.ActivePlayer?.Id;
                    activePlayerName = room.ActivePlayer?.Name;
                    shouldStartNextRound = true;
                }
                else
                {
                    shouldEndGame = true;
                }
            }
            if (shouldStartNextRound && activePlayerConnectionId != null)
            {
                await hubContext.Clients.Client(activePlayerConnectionId).SendAsync("StartWordSelection", wordOptions, room.DrawTimeSeconds);
                await hubContext.Clients.GroupExcept(roomCode, activePlayerConnectionId).SendAsync("GameStarted", activePlayerId, activePlayerName, room.DrawTimeSeconds);
                if (room != null)
                {
                    _ = ScheduleSelectionTimeout(roomCode, DateTime.Now.AddSeconds(5000).ToUniversalTime().ToString());
                }
            }
            else if (shouldEndGame)
            {
                await OnGameOver(roomCode);
            }
        }

        #region private methods

        private async Task OnGameOver(string roomCode)
        {
            if (!Rooms.TryGetValue(roomCode, out GameRoom? room))
            {
                return;
            }
            if (room == null || room.IsExpired)
            {
                return;
            }

            GameOverResponse response = new();

            lock (GetRoomLock(roomCode))
            {
                if (!Rooms.TryGetValue(roomCode, out room) || room == null || room.IsExpired)
                {
                    return;
                }

                room.Status = GameStatus.GameEnded;

                var sortedPlayers = room.Players.Values
                    .OrderByDescending(p => p.Score)
                    .ToList();

                response.FinalScores = sortedPlayers;
                response.Winner = sortedPlayers.FirstOrDefault();
                room.FinalResult = response;
            }
            await hubContext.Clients.Group(roomCode).SendAsync("GameOver", response);
        }
        private static List<string> SendChooseWord(GameRoom room)
        {
            IEnumerable<string> wordOptions;
            wordOptions = Random.Shared.GetItems(room.CustomWords.ToArray(), 3);
            var randomPlayer = room.Players.Values.ElementAt(Random.Shared.Next(room.Players.Count));
            room.ActivePlayer = randomPlayer;
            var optionsList = wordOptions.ToList();
            room.CurrentWordOptions = optionsList;
            return optionsList;
        }
        private async Task ScheduleSelectionTimeout(string roomCode, string expectedSelectionEndTime)
        {
            if (!DateTime.TryParse(expectedSelectionEndTime, null, System.Globalization.DateTimeStyles.AdjustToUniversal, out var endTime))
            {
                return;
            }

            var delay = endTime - DateTime.UtcNow;
            if (delay < TimeSpan.Zero)
                delay = TimeSpan.Zero;

            await Task.Delay(delay);

            string? playerId = null;
            string? connectionId = null;
            string? chosenWord = null;

            lock (GetRoomLock(roomCode))
            {
                if (!Rooms.TryGetValue(roomCode, out var room) || room.IsExpired)
                    return;

                if (room.Status != GameStatus.SelectingWord || room.SelectionEndTime != expectedSelectionEndTime)
                    return;

                if (room.ActivePlayer == null || room.CurrentWordOptions.Count == 0)
                    return;

                playerId = room.ActivePlayer.Id;
                connectionId = room.ActivePlayer.ConnectionId;
                chosenWord = room.CurrentWordOptions[Random.Shared.Next(room.CurrentWordOptions.Count)];
            }

            if (playerId != null && connectionId != null && chosenWord != null)
            {
                await OnWordChosen(roomCode, playerId, connectionId, chosenWord);
            }
        }
        #endregion
    }
}
