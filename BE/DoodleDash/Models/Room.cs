using System.Collections.Concurrent;
using System.ComponentModel.DataAnnotations;

namespace DoodleDash.Models
{
    public enum GameStatus { Lobby, SelectingWord, Playing, RoundEnded, GameEnded }

    public class Player
    {
        public required string Name { get; set; }

        public required string Id { get; set; }

        public int Score { get; set; } = 0;

    }
    public class GameRoom
    {
        [Required]
        public required string HostId { get; set; }

        [Required]
        public required string HostName { get; set; }
        public required string RoomCode { get; set; }
        [Required]
        public required string RoomName { get; set; }
        [Required]
        public required Int64 MaxPlayerCount { get; set; }

        public List<string> CustomWords { get; set; } = [];

        public ConcurrentDictionary<string, Player> Players = new();

        public string? ActivePlayerId { get; set; }

        public bool IsExpired { get; set; } = false;

        public GameStatus Status { get; set; } = GameStatus.Lobby;

        public int CurrentRound { get; set; } = 1;

        public int TotalRounds { get; set; } = 1;

        public int CurrentDrawerIndex { get; set; } = 0;

        public string? CurrentWord { get; set; }

        public List<string> WordOptions { get; set; } = [];

        public HashSet<string> GuessedPlayerIds { get; set; } = [];
    }

    public class CreateRoomRequest
    {
        [Required]
        public required string HostName { get; set; }

        [Required]
        public required string RoomName { get; set; }

        [Required]
        public required long MaxPlayerCount { get; set; }

        public List<string> CustomWords { get; set; } = [];
    }

    public class JoinRoomResult
    {
        public bool Success { get; set; }
        public string? ErrorCode { get; set; }
        public string? ErrorMessage { get; set; }
        public Player? Player { get; set; }
        public GameRoom? Room { get; set; }
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

    public class GameStateDto
    {
        public GameStatus Status { get; set; }
        public string? CurrentDrawerId { get; set; }
        public string? CurrentDrawerName { get; set; }
        public string? WordDisplay { get; set; }
        public int CurrentRound { get; set; }
        public int TotalRounds { get; set; }
        public List<PlayerScoreDto> Players { get; set; } = [];
        public bool HasGuessedCorrectly { get; set; }
        public List<string>? WordOptions { get; set; }
    }

    public class PlayerScoreDto
    {
        public string PlayerId { get; set; } = "";
        public string PlayerName { get; set; } = "";
        public int Score { get; set; }
        public bool IsDrawer { get; set; }
    }

    public class StartGameResult
    {
        public bool Success { get; set; }
        public string? ErrorCode { get; set; }
        public string? ErrorMessage { get; set; }
        public GameStateDto? GameState { get; set; }
    }

    public class SelectWordResult
    {
        public bool Success { get; set; }
        public string? ErrorCode { get; set; }
        public string? ErrorMessage { get; set; }
        public GameStateDto? GameState { get; set; }
    }

    public class DrawActionResult
    {
        public bool Success { get; set; }
        public string? ErrorCode { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public class GuessResult
    {
        public bool Success { get; set; }
        public bool IsCorrect { get; set; }
        public string? ErrorCode { get; set; }
        public string? ErrorMessage { get; set; }
        public int PointsAwarded { get; set; }
    }

}