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

        private const int GUESSER_POINTS = 100;
        private const int DRAWER_POINTS = 50;

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

                return room.Players.TryAdd(p.Id, p);
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
                if (rooms.TryAdd(roomCode, room)) return room;
                retryCount++;
            }
            return null;
        }

        public bool TryRemovePlayer(string roomCode, string playerId)
        {
            if (!rooms.TryGetValue(roomCode, out GameRoom? room))
                return false;

            lock (GetRoomLock(roomCode))
            {
                if (!rooms.TryGetValue(roomCode, out room))
                    return false;

                Player? removed;
                return room.Players.TryRemove(playerId, out removed);
            }
        }

        public GameRoom? GetGameRoom(string roomCode)
        {
            rooms.TryGetValue(roomCode, out GameRoom? room);
            return room;
        }

        public bool TryStartGame(string roomCode, string hostId)
        {
            if (!rooms.TryGetValue(roomCode, out GameRoom? room))
                return false;

            lock (GetRoomLock(roomCode))
            {
                if (!rooms.TryGetValue(roomCode, out room))
                    return false;

                if (room.HostId != hostId)
                    return false;

                if (room.Status != GameStatus.Lobby)
                    return false;

                if (room.Players.Count < 2)
                    return false;

                room.Status = GameStatus.SelectingWord;
                room.CurrentRound = 1;
                room.TotalRounds = 1;
                room.CurrentDrawerIndex = 0;
                room.GuessedPlayerIds.Clear();
                room.WordOptions = DefaultWords.GetRandomWords(3);

                return true;
            }
        }

        public bool TrySelectWord(string roomCode, string playerId, int wordIndex)
        {
            if (!rooms.TryGetValue(roomCode, out GameRoom? room))
                return false;

            lock (GetRoomLock(roomCode))
            {
                if (!rooms.TryGetValue(roomCode, out room))
                    return false;

                var playerIds = room.Players.Keys.ToList();
                if (room.CurrentDrawerIndex >= playerIds.Count)
                    return false;

                var drawerId = playerIds[room.CurrentDrawerIndex];
                if (drawerId != playerId)
                    return false;

                if (room.Status != GameStatus.SelectingWord)
                    return false;

                if (wordIndex < 0 || wordIndex >= room.WordOptions.Count)
                    return false;

                room.CurrentWord = room.WordOptions[wordIndex];
                room.Status = GameStatus.Playing;
                room.GuessedPlayerIds.Clear();

                return true;
            }
        }

        public bool TrySubmitGuess(string roomCode, string playerId, string guess, out bool isCorrect, out int pointsAwarded)
        {
            isCorrect = false;
            pointsAwarded = 0;

            if (!rooms.TryGetValue(roomCode, out GameRoom? room))
                return false;

            lock (GetRoomLock(roomCode))
            {
                if (!rooms.TryGetValue(roomCode, out room))
                    return false;

                if (room.Status != GameStatus.Playing)
                    return false;

                var playerIds = room.Players.Keys.ToList();
                if (room.CurrentDrawerIndex >= playerIds.Count)
                    return false;

                var drawerId = playerIds[room.CurrentDrawerIndex];
                if (drawerId == playerId)
                    return false;

                if (room.GuessedPlayerIds.Contains(playerId))
                    return false;

                if (string.IsNullOrWhiteSpace(room.CurrentWord))
                    return false;

                if (guess.Trim().Equals(room.CurrentWord, StringComparison.OrdinalIgnoreCase))
                {
                    isCorrect = true;
                    pointsAwarded = GUESSER_POINTS;

                    if (room.Players.TryGetValue(playerId, out Player? guesser))
                    {
                        guesser.Score += GUESSER_POINTS;
                    }

                    if (room.Players.TryGetValue(drawerId, out Player? drawer))
                    {
                        drawer.Score += DRAWER_POINTS;
                    }

                    room.GuessedPlayerIds.Add(playerId);

                    var guesserCount = room.Players.Count - 1;
                    if (room.GuessedPlayerIds.Count >= guesserCount)
                    {
                        room.Status = GameStatus.RoundEnded;
                    }

                    return true;
                }

                return true;
            }
        }

        public GameStateDto? GetGameState(string roomCode, string playerId)
        {
            if (!rooms.TryGetValue(roomCode, out GameRoom? room))
                return null;

            if (!room.Players.ContainsKey(playerId))
                return null;

            var playerIds = room.Players.Keys.ToList();
            string? currentDrawerId = null;
            string? currentDrawerName = null;

            if (room.CurrentDrawerIndex < playerIds.Count)
            {
                currentDrawerId = playerIds[room.CurrentDrawerIndex];
                if (room.Players.TryGetValue(currentDrawerId, out Player? drawer))
                {
                    currentDrawerName = drawer.Name;
                }
            }

            string? wordDisplay = null;
            List<string>? wordOptions = null;

            if (playerId == currentDrawerId)
            {
                wordDisplay = room.CurrentWord;
                wordOptions = room.Status == GameStatus.SelectingWord ? room.WordOptions : null;
            }
            else if (room.Status == GameStatus.Playing && !string.IsNullOrEmpty(room.CurrentWord))
            {
                wordDisplay = new string('_', room.CurrentWord.Length);
            }
            else if (room.Status == GameStatus.RoundEnded || room.Status == GameStatus.GameEnded)
            {
                wordDisplay = room.CurrentWord;
            }

            var playerList = room.Players.Values.Select(p => new PlayerScoreDto
            {
                PlayerId = p.Id,
                PlayerName = p.Name,
                Score = p.Score,
                IsDrawer = p.Id == currentDrawerId
            }).ToList();

            return new GameStateDto
            {
                Status = room.Status,
                CurrentDrawerId = currentDrawerId,
                CurrentDrawerName = currentDrawerName,
                WordDisplay = wordDisplay,
                CurrentRound = room.CurrentRound,
                TotalRounds = room.TotalRounds,
                Players = playerList,
                HasGuessedCorrectly = room.GuessedPlayerIds.Contains(playerId),
                WordOptions = wordOptions
            };
        }
    }
}