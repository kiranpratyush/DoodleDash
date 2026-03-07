using Microsoft.AspNetCore.SignalR;
using DoodleDash.Models;
using DoodleDash.Services;

namespace DoodleDash.Hubs
{
    class DoodleDashHub : Hub
    {
        private readonly IRoomManager roomManager;

        public DoodleDashHub(IRoomManager _roomManager)
        {
            roomManager = _roomManager;
        }

        public async Task<JoinRoomResult> JoinRoom(string roomCode, string playerName)
        {
            var room = roomManager.GetGameRoom(roomCode);

            if (room == null)
            {
                return new JoinRoomResult
                {
                    Success = false,
                    ErrorCode = "ROOM_NOT_FOUND",
                    ErrorMessage = "Room not found"
                };
            }

            if (room.IsExpired)
            {
                return new JoinRoomResult
                {
                    Success = false,
                    ErrorCode = "ROOM_EXPIRED",
                    ErrorMessage = "Room has expired"
                };
            }

            if (room.Players.Count >= room.MaxPlayerCount)
            {
                return new JoinRoomResult
                {
                    Success = false,
                    ErrorCode = "ROOM_FULL",
                    ErrorMessage = "Room is full"
                };
            }

            var player = new Player
            {
                Id = Guid.NewGuid().ToString(),
                Name = playerName
            };

            if (!roomManager.TryAddPlayer(roomCode, player))
            {
                return new JoinRoomResult
                {
                    Success = false,
                    ErrorCode = "JOIN_FAILED",
                    ErrorMessage = "Failed to join room"
                };
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);

            Context.Items["PlayerId"] = player.Id;
            Context.Items["RoomCode"] = roomCode;

            return new JoinRoomResult
            {
                Success = true,
                Player = player,
                Room = room
            };
        }

        public async Task<StartGameResult> StartGame()
        {
            var playerId = Context.Items["PlayerId"] as string;
            var roomCode = Context.Items["RoomCode"] as string;

            if (playerId == null || roomCode == null)
            {
                return new StartGameResult
                {
                    Success = false,
                    ErrorCode = "NOT_IN_ROOM",
                    ErrorMessage = "You are not in a room"
                };
            }

            if (!roomManager.TryStartGame(roomCode, playerId))
            {
                return new StartGameResult
                {
                    Success = false,
                    ErrorCode = "START_FAILED",
                    ErrorMessage = "Failed to start game"
                };
            }

            var gameState = roomManager.GetGameState(roomCode, playerId);

            await Clients.Group(roomCode).SendAsync("GameStarted", gameState);

            return new StartGameResult
            {
                Success = true,
                GameState = gameState
            };
        }

        public async Task<SelectWordResult> SelectWord(int wordIndex)
        {
            var playerId = Context.Items["PlayerId"] as string;
            var roomCode = Context.Items["RoomCode"] as string;

            if (playerId == null || roomCode == null)
            {
                return new SelectWordResult
                {
                    Success = false,
                    ErrorCode = "NOT_IN_ROOM",
                    ErrorMessage = "You are not in a room"
                };
            }

            if (!roomManager.TrySelectWord(roomCode, playerId, wordIndex))
            {
                return new SelectWordResult
                {
                    Success = false,
                    ErrorCode = "SELECT_FAILED",
                    ErrorMessage = "Failed to select word"
                };
            }

            var gameState = roomManager.GetGameState(roomCode, playerId);

            await Clients.Group(roomCode).SendAsync("WordSelected", gameState);

            return new SelectWordResult
            {
                Success = true,
                GameState = gameState
            };
        }

        public async Task<DrawActionResult> Draw(DrawAction action)
        {
            var playerId = Context.Items["PlayerId"] as string;
            var roomCode = Context.Items["RoomCode"] as string;

            if (playerId == null || roomCode == null)
            {
                return new DrawActionResult
                {
                    Success = false,
                    ErrorCode = "NOT_IN_ROOM",
                    ErrorMessage = "You are not in a room"
                };
            }

            var gameState = roomManager.GetGameState(roomCode, playerId);
            if (gameState == null)
            {
                return new DrawActionResult
                {
                    Success = false,
                    ErrorCode = "ROOM_NOT_FOUND",
                    ErrorMessage = "Room not found"
                };
            }

            if (gameState.Status != GameStatus.Playing)
            {
                return new DrawActionResult
                {
                    Success = false,
                    ErrorCode = "NOT_PLAYING",
                    ErrorMessage = "Game is not currently playing"
                };
            }

            if (gameState.CurrentDrawerId != playerId)
            {
                return new DrawActionResult
                {
                    Success = false,
                    ErrorCode = "NOT_DRAWER",
                    ErrorMessage = "You are not the current drawer"
                };
            }

            action.PlayerId = playerId;
            await Clients.Group(roomCode).SendAsync("ReceiveDraw", action);

            return new DrawActionResult { Success = true };
        }

        public Task<GameStateDto?> GetGameState()
        {
            var playerId = Context.Items["PlayerId"] as string;
            var roomCode = Context.Items["RoomCode"] as string;

            if (playerId == null || roomCode == null)
                return Task.FromResult<GameStateDto?>(null);

            return Task.FromResult(roomManager.GetGameState(roomCode, playerId));
        }

        public async Task<GuessResult> SubmitGuess(string guessText)
        {
            var playerId = Context.Items["PlayerId"] as string;
            var roomCode = Context.Items["RoomCode"] as string;

            if (playerId == null || roomCode == null)
            {
                return new GuessResult
                {
                    Success = false,
                    ErrorCode = "NOT_IN_ROOM",
                    ErrorMessage = "You are not in a room"
                };
            }

            if (string.IsNullOrWhiteSpace(guessText))
            {
                return new GuessResult
                {
                    Success = false,
                    ErrorCode = "INVALID_GUESS",
                    ErrorMessage = "Guess cannot be empty"
                };
            }

            var room = roomManager.GetGameRoom(roomCode);
            if (room == null)
            {
                return new GuessResult
                {
                    Success = false,
                    ErrorCode = "ROOM_NOT_FOUND",
                    ErrorMessage = "Room not found"
                };
            }

            if (!room.Players.TryGetValue(playerId, out Player? player))
            {
                return new GuessResult
                {
                    Success = false,
                    ErrorCode = "PLAYER_NOT_FOUND",
                    ErrorMessage = "Player not found in room"
                };
            }

            var guess = new Guess
            {
                PlayerId = playerId,
                PlayerName = player.Name,
                Text = guessText.Trim()
            };

            await Clients.Group(roomCode).SendAsync("ReceiveGuess", guess);

            if (!roomManager.TrySubmitGuess(roomCode, playerId, guessText.Trim(), out bool isCorrect, out int pointsAwarded))
            {
                return new GuessResult
                {
                    Success = false,
                    ErrorCode = "GUESS_FAILED",
                    ErrorMessage = "Failed to process guess"
                };
            }

            if (isCorrect)
            {
                var gameState = roomManager.GetGameState(roomCode, playerId);
                await Clients.Group(roomCode).SendAsync("PlayerGuessedCorrectly", playerId, player.Name, pointsAwarded, gameState);
            }

            return new GuessResult
            {
                Success = true,
                IsCorrect = isCorrect,
                PointsAwarded = pointsAwarded
            };
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var playerId = Context.Items["PlayerId"] as string;
            var roomCode = Context.Items["RoomCode"] as string;

            if (playerId != null && roomCode != null)
            {
                roomManager.TryRemovePlayer(roomCode, playerId);
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}
