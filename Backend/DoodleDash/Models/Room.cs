using Microsoft.Extensions.Logging.Abstractions;
using System.Collections.Concurrent;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace DoodleDash.Models
{
    public enum GameStatus { Lobby, SelectingWord, Drawing, RoundEnded, GameEnded }

    public enum MessageType { User, System }


    public class Hint
    {
        [JsonPropertyName("index")]
        public required int Index;

        [JsonPropertyName("character")]
        public required char Character;
    }


    public class Response
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }
        [JsonPropertyName("errorCode")]
        public string? ErrorCode { get; set; }

        [JsonPropertyName("errorMessage")]
        public string? ErrorMessage { get; set; }
    }

    public class Player
    {
        [JsonPropertyName("name")]
        public required string Name { get; set; }

        [JsonPropertyName("id")]
        public required string Id { get; set; }

        [JsonPropertyName("connectionID")]
        public required string ConnectionId { get; set; }

        [JsonPropertyName("score")]
        public int Score { get; set; } = 0;

    }

    public class ChatMessage
    {
        [JsonPropertyName("playerId")]
        public required string PlayerId { get; set; }

        [JsonPropertyName("playerName")]
        public required string PlayerName { get; set; }

        [JsonPropertyName("message")]
        public string Message { get; set; } = "";

        [JsonPropertyName("messageType")]
        public MessageType MessageType { get; set; }
    }

    public class WordHint
    {
        [JsonPropertyName("length")]
        public int Length { get; set; }

        [JsonPropertyName("revealedIndices")]
        public List<Hint> RevealedIndices { get; set; } = [];
    }

    public class GameRoom
    {
        [Required]
        public required string HostId { get; set; }

        [Required]
        public required string HostName { get; set; }
        public required string RoomCode { get; set; }

        [Required]
        public required Int64 MaxPlayerCount { get; set; }

        public string? LobbyMessage { get; set; } = "";

        public string? RoundEndTime { get; set; }

        public List<string> CustomWords { get; set; } = [];

        public ConcurrentDictionary<string, Player> Players { get; set; } = new();

        public Player? ActivePlayer { get; set; }

        public bool IsExpired { get; set; } = false;

        public GameStatus Status { get; set; } = GameStatus.Lobby;

        public int CurrentRound { get; set; } = 1;

        public int TotalRounds { get; set; } = 1;

        public int DrawTimeSeconds { get; set; } = 60;

        public int WordSelectionSeconds { get; set; } = 20;

        public string? CurrentWord { get; set; }

        public List<string> CurrentWordOptions { get; set; } = [];

        public HashSet<string> GuessedPlayerIds { get; set; } = [];

        public List<ChatMessage> ChatMessages { get; set; } = [];

        public WordHint? CurrentWordHint { get; set; }

        public string? SelectionEndTime { get; set; }

        public RoundOverResponse? LastRoundResult { get; set; }

        public GameOverResponse? FinalResult { get; set; }
    }

    public class GameSnapShotResponse
    {
        [JsonPropertyName("gameStatus")]
        public GameStatus Status { get; set; } = GameStatus.Lobby;

        [JsonPropertyName("hostId")]
        public string? HostId { get; set; }

        [JsonPropertyName("lobbyMessage")]
        public string? LobbyMessage { get; set; } = "";

        [JsonPropertyName("roundNumber")]
        public int RoundNumber { get; set; }

        [JsonPropertyName("totalRounds")]
        public int TotalRounds { get; set; }

        [JsonPropertyName("drawTimeSeconds")]
        public int DrawTimeSeconds { get; set; }

        [JsonPropertyName("chatMessages")]
        public List<ChatMessage> ChatMessages { get; set; } = [];

        [JsonPropertyName("players")]
        public List<Player> Players { get; set; } = [];

        [JsonPropertyName("player")]
        public Player? ActivePlayer { get; set; }

        [JsonPropertyName("currentWordHint")]
        public WordHint? CurrentWordHint { get; set; }

        [JsonPropertyName("roundEndTime")]
        public string? RoundEndTime { get; set; }

        [JsonPropertyName("drawData")]
        public List<List<float>> DrawData { get; set; } = [];

        [JsonPropertyName("selectionEndTime")]
        public string? SelectionEndTime { get; set; }

        [JsonPropertyName("lastRoundResult")]
        public RoundOverResponse? LastRoundResult { get; set; }

        [JsonPropertyName("finalResult")]
        public GameOverResponse? FinalResult { get; set; }

    }

    public class RoundStartedResponse : Response
    {
        public Player? ActivePlayer { get; set; }
        public WordHint? CurrentWordHint { get; set; }
        public string? RoundEndTime { get; set; }
        public int RoundNumber { get; set; }
        public string? CurrentWord { get; set; }

        public int RoundDrawTimeSeconds { get; set; }
    }

    public class CreateRoomRequest
    {
        [Required]
        public required string PlayerName { get; set; }

        [Required]
        public required int MaxAllowedPlayers { get; set; }

        [Required]
        public required long TotalRounds { get; set; }

        [Required]
        public required int DrawTimeSeconds { get; set; }
        public List<string> CustomWords { get; set; } = [];
    }

    public class CreateRoomResponse
    {
        [JsonPropertyName("playerId")]
        public string PlayerId { get; set; } = "";

        [JsonPropertyName("playerName")]
        public string PlayerName { get; set; } = "";

        [JsonPropertyName("roomCode")]
        public required string RoomCode { get; set; }
    }

    public class Guess
    {
        public required string PlayerId { get; set; }
        public required string PlayerName { get; set; }
        public required string Text { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
    public class GuessResult
    {
        public bool Success { get; set; }
        public bool IsCorrect { get; set; }
        public string? ErrorCode { get; set; }
        public string? ErrorMessage { get; set; }
        public int PointsAwarded { get; set; }
    }

    public class RoomSnapShotResponse : Response
    {
        [JsonPropertyName("player")]
        public Player? Player { get; set; }
        [JsonPropertyName("snapShotResponse")]
        public GameSnapShotResponse? SnapShotResponse { get; set; }

    }

    public class RoundOverResponse : Response
    {
        [JsonPropertyName("players")]
        public List<Player> Players { get; set; } = [];

        [JsonPropertyName("correctWord")]
        public string CorrectWord { get; set; } = "";

        [JsonPropertyName("roundNumber")]
        public int RoundNumber { get; set; }
    }

    public class GameOverResponse : Response
    {
        [JsonPropertyName("finalScores")]
        public List<Player> FinalScores { get; set; } = [];

        [JsonPropertyName("winner")]
        public Player? Winner { get; set; }
    }
}
