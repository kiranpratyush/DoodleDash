using DoodleDash.Hubs;
using DoodleDash.Models;
using DoodleDash.Utils;
using Microsoft.AspNetCore.SignalR;

namespace DoodleDash.Services
{
    partial class RoomManager : IRoomManager
    {
        private readonly IHubContext<DoodleDashHub> hubContext;
        private readonly IRoomStateStore roomStateStore;
        private const int DefaultWordSelectionSeconds = 20;

        public RoomManager(IHubContext<DoodleDashHub> hubContext, IRoomStateStore roomStateStore)
        {
            this.hubContext = hubContext;
            this.roomStateStore = roomStateStore;
        }

        public GameRoom? GetRoom(string roomCode) => roomStateStore.GetRoom(roomCode);

        public GameRoom? CreateRoom(CreateRoomRequest roomRequest)
        {
            int retryCount = 0;
            const int MaxRetryCount = 3;

            while (retryCount < MaxRetryCount)
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

                if (roomStateStore.TryCreateRoom(room))
                {
                    return room;
                }

                retryCount++;
            }

            return null;
        }

        public RoomSnapShotResponse TryAddPlayer(string roomCode, string playerName, string connectionId, string? playerId)
        {
            var storeResponse = roomStateStore.TryAddOrReconnectPlayer(roomCode, playerName, connectionId, playerId);
            var roomResponse = new RoomSnapShotResponse
            {
                Success = storeResponse.Success,
                ErrorCode = storeResponse.ErrorCode,
                ErrorMessage = storeResponse.ErrorMessage,
                Player = storeResponse.Player,
                IsReconnect = storeResponse.IsReconnect
            };

            if (!storeResponse.Success || storeResponse.Room == null)
            {
                return roomResponse;
            }

            roomResponse.SnapShotResponse = BuildSnapshot(storeResponse.Room);
            return roomResponse;
        }

        public async Task StartGame(string roomCode)
        {
            List<string> wordOptions = [];
            string? selectionEndTime = null;
            GameRoom? room = null;

            using (var roomLock = roomStateStore.AcquireRoomLock(roomCode))
            {
                if (roomLock == null)
                    return;

                room = roomStateStore.GetRoom(roomCode);
                if (room == null || room.Players.Count < 2 || room.Status != GameStatus.Lobby)
                    return;

                room.Status = GameStatus.SelectingWord;
                room.SelectionEndTime = DateTime.UtcNow.AddSeconds(room.WordSelectionSeconds).ToString("o");
                room.LastRoundResult = null;
                room.FinalResult = null;
                wordOptions = SendChooseWord(room);
                selectionEndTime = room.SelectionEndTime;
                roomStateStore.SaveRoom(room);
            }

            if (room.ActivePlayer != null)
            {
                await hubContext.Clients.Client(room.ActivePlayer.ConnectionId)
                    .SendAsync("StartWordSelection", wordOptions, room.DrawTimeSeconds, room.CurrentRound);
                await hubContext.Clients.GroupExcept(roomCode, room.ActivePlayer.ConnectionId)
                    .SendAsync("GameStarted", room.ActivePlayer.Id, room.ActivePlayer.Name, room.DrawTimeSeconds, room.CurrentRound);
            }

            if (selectionEndTime != null)
            {
                _ = ScheduleSelectionTimeout(roomCode, selectionEndTime);
            }
        }

        public async Task ReplayGame(string roomCode, string playerId, string connectionId)
        {
            List<Player> resetPlayers = [];
            bool shouldStartGame = false;

            using (var roomLock = roomStateStore.AcquireRoomLock(roomCode))
            {
                if (roomLock == null)
                    return;

                var room = roomStateStore.GetRoom(roomCode);
                if (room == null || room.IsExpired)
                    return;

                if (!room.Players.TryGetValue(playerId, out var player))
                    return;

                if (player.ConnectionId != connectionId || room.HostId != playerId || room.Status != GameStatus.GameEnded)
                    return;

                room.Status = GameStatus.Lobby;
                room.CurrentRound = 1;
                room.ActivePlayer = null;
                room.CurrentWord = null;
                room.CurrentWordHint = null;
                room.RoundEndTime = null;
                room.SelectionEndTime = null;
                room.CurrentWordOptions = [];
                room.GuessedPlayerIds.Clear();
                room.ChatMessages.Clear();
                room.DrawData.Clear();
                room.LastRoundResult = null;
                room.FinalResult = null;

                foreach (var existingPlayer in room.Players.Values)
                {
                    existingPlayer.Score = 0;
                    resetPlayers.Add(existingPlayer);
                }

                shouldStartGame = room.Players.Count >= 2;
                roomStateStore.SaveRoom(room);
            }

            await hubContext.Clients.Group(roomCode).SendAsync("ReplayStarted");

            foreach (var resetPlayer in resetPlayers)
            {
                await hubContext.Clients.Group(roomCode).SendAsync("PlayerScoreUpdated", resetPlayer);
            }

            if (shouldStartGame)
            {
                await StartGame(roomCode);
            }
        }

        public Player? TryRemovePlayer(string roomCode, string playerId)
        {
            return roomStateStore.TryRemovePlayer(roomCode, playerId);
        }

        public async Task OnRoundOver(string roomCode)
        {
            var room = roomStateStore.GetRoom(roomCode);
            if (room == null || room.IsExpired)
            {
                return;
            }

            RoundOverResponse response = new();
            string? activePlayerConnectionId = null;
            List<string>? wordOptions = null;
            string? activePlayerId = null;
            string? activePlayerName = null;
            bool shouldStartNextRound = false;
            bool shouldEndGame = false;

            using (var roomLock = roomStateStore.AcquireRoomLock(roomCode))
            {
                if (roomLock == null)
                    return;

                room = roomStateStore.GetRoom(roomCode);
                if (room == null || room.IsExpired)
                    return;

                room.Status = GameStatus.RoundEnded;
                response.Success = true;
                response.RoundNumber = room.CurrentRound;
                response.CorrectWord = room.CurrentWord ?? "";
                foreach (var player in room.Players.Values)
                {
                    response.Players.Add(player);
                }

                room.LastRoundResult = response;
                roomStateStore.SaveRoom(room);
            }
            await hubContext.Clients.Group(roomCode).SendAsync("RoundOver", response);

            await Task.Delay(5000);

            using (var roomLock = roomStateStore.AcquireRoomLock(roomCode))
            {
                if (roomLock == null)
                    return;

                room = roomStateStore.GetRoom(roomCode);
                if (room == null || room.IsExpired)
                    return;

                if (room.CurrentRound < room.TotalRounds)
                {
                    room.CurrentRound++;
                    room.Status = GameStatus.SelectingWord;
                    room.CurrentWord = null;
                    room.CurrentWordHint = null;
                    room.SelectionEndTime = DateTime.UtcNow.AddSeconds(room.WordSelectionSeconds).ToString("o");
                    room.LastRoundResult = null;
                    room.DrawData.Clear();

                    wordOptions = SendChooseWord(room);
                    activePlayerConnectionId = room.ActivePlayer?.ConnectionId;
                    activePlayerId = room.ActivePlayer?.Id;
                    activePlayerName = room.ActivePlayer?.Name;
                    shouldStartNextRound = true;
                    roomStateStore.SaveRoom(room);
                }
                else
                {
                    shouldEndGame = true;
                }
            }

            if (shouldStartNextRound && activePlayerConnectionId != null)
            {
                await hubContext.Clients.Client(activePlayerConnectionId)
                    .SendAsync("StartWordSelection", wordOptions, room.DrawTimeSeconds, room.CurrentRound);
                await hubContext.Clients.GroupExcept(roomCode, activePlayerConnectionId)
                    .SendAsync("GameStarted", activePlayerId, activePlayerName, room.DrawTimeSeconds, room.CurrentRound);

                if (room.SelectionEndTime != null)
                {
                    _ = ScheduleSelectionTimeout(roomCode, room.SelectionEndTime);
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
            var room = roomStateStore.GetRoom(roomCode);
            if (room == null || room.IsExpired)
            {
                return;
            }

            GameOverResponse response = new();

            using (var roomLock = roomStateStore.AcquireRoomLock(roomCode))
            {
                if (roomLock == null)
                    return;

                room = roomStateStore.GetRoom(roomCode);
                if (room == null || room.IsExpired)
                    return;

                room.Status = GameStatus.GameEnded;

                var sortedPlayers = room.Players.Values
                    .OrderByDescending(p => p.Score)
                    .ToList();

                response.FinalScores = sortedPlayers;
                response.Winner = sortedPlayers.FirstOrDefault();
                room.FinalResult = response;
                roomStateStore.SaveRoom(room);
            }

            await hubContext.Clients.Group(roomCode).SendAsync("GameOver", response);
        }

        private static List<string> SendChooseWord(GameRoom room)
        {
            var wordOptions = Random.Shared.GetItems(room.CustomWords.ToArray(), 3);
            room.ActivePlayer = room.Players.Values.ElementAt(Random.Shared.Next(room.Players.Count));
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

            using (var roomLock = roomStateStore.AcquireRoomLock(roomCode))
            {
                if (roomLock == null)
                    return;

                var room = roomStateStore.GetRoom(roomCode);
                if (room == null || room.IsExpired)
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

        private GameSnapShotResponse BuildSnapshot(GameRoom room)
        {
            var snapshot = new GameSnapShotResponse
            {
                Status = room.Status,
                HostId = room.HostId,
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
                snapshot.DrawData = room.DrawData;
            }
            else if (room.Status == GameStatus.RoundEnded)
            {
                snapshot.LastRoundResult = room.LastRoundResult;
            }
            else if (room.Status == GameStatus.GameEnded)
            {
                snapshot.FinalResult = room.FinalResult;
            }

            return snapshot;
        }
        #endregion
    }
}
