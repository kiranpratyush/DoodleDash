namespace DoodleDash.Models
{
    public class RedisRoomOptions
    {
        public const string SectionName = "Redis";

        public string ConnectionString { get; set; } = "localhost:6379";

        public string KeyPrefix { get; set; } = "doodledash";

        public int RoomTtlMinutes { get; set; } = 120;

        public int LockTimeoutSeconds { get; set; } = 5;
    }
}
