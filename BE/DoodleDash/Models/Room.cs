using Microsoft.Extensions.Logging.Abstractions;
using System.Collections.Concurrent;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace DoodleDash.Models
{
    public enum GameStatus { Lobby, SelectingWord, Playing, RoundEnded, GameEnded }

    public enum MessageType { User, System }

    public record Hints(int Index, char? Letter);

    public class Player
    {
        public required string Name { get; set; }

        public required string Id { get; set; }

        public required string ConnectionId { get; set; }

        public int Score { get; set; } = 0;

    }

    public class ChatMessages
    {
        public required string PlayerId { get; set; }

        public required string PlayerName { get; set; }

        public string Message { get; set; } = "";

        public MessageType MessageType { get; set; }
    }

    public class WordHint
    {
        public int Length { get; set; }

        public List<Hints> RevealedIndices { get; set; } = [];
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

        public DateTime? RoundEndTime { get; set; }

        public List<string> CustomWords { get; set; } = [];

        public ConcurrentDictionary<string, Player> Players { get; set; } = new();

        public Player? ActivePlayer { get; set; }

        public bool IsExpired { get; set; } = false;

        public GameStatus Status { get; set; } = GameStatus.Lobby;

        public int CurrentRound { get; set; } = 1;

        public int TotalRounds { get; set; } = 1;

        public string? CurrentWord { get; set; }

        public HashSet<string> GuessedPlayerIds { get; set; } = [];

        public List<ChatMessages> ChatMessages { get; set; } = [];

        public WordHint? CurrentWordHint { get; set; }
    }

    public class GameSnapShotResponse
    {
        public string? LobbyMessage { get; set; } = "";

        public int RoundNumber { get; set; }

        public List<ChatMessages> ChatMessages { get; set; } = [];

        public List<Player> Players { get; set; } = [];

        public WordHint? CurrentWordHint { get; set; }

        public DateTime? RoundEndTime { get; set; }

        public List<List<float>> DrawData { get; set; } = [];

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

    public class SubmitGuessResult
    {
        public bool Success { get; set; }
        public string? ErrorCode { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public class DrawAction
    {
        public required string PlayerId { get; set; }
        public required float X0 { get; set; }
        public required float Y0 { get; set; }
        public required float X1 { get; set; }
        public required float Y1 { get; set; }
        public string Color { get; set; } = "#000000";
        public int BrushSize { get; set; } = 4;
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

    public class RoomSnapShotResponse
    {
        public bool Success { get; set; }
        public string? ErrorCode { get; set; }
        public string? ErrorMessage { get; set; }
        public Player? Player { get; set; }
        public GameSnapShotResponse? SnapShotResponse { get; set; }

    }
}