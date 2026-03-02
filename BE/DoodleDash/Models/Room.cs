using System.ComponentModel.DataAnnotations;

namespace DoodleDash.Models
{
    public class Player
    {
        public required string Name { get; set; }

        public required string Id { get; set; }
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

        public List<Player> Players { get; set; } = [];

        public string? ActivePlayerId { get; set; }

        public bool IsExpired { get; set; } = false;
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

}