using DoodleDash.Models;

namespace DoodleDash.Services
{
    public interface IRoomStateStore
    {
        bool TryCreateRoom(GameRoom room);

        GameRoom? GetRoom(string roomCode);

        IRoomLockHandle? AcquireRoomLock(string roomCode);

        void SaveRoom(GameRoom room);

        RoomStateStoreAddPlayerResult TryAddOrReconnectPlayer(string roomCode, string playerName, string connectionId, string? playerId);

        Player? TryRemovePlayer(string roomCode, string playerId);
    }

    public interface IRoomLockHandle : IDisposable
    {
    }

    public class RoomStateStoreAddPlayerResult : Response
    {
        public GameRoom? Room { get; set; }

        public Player? Player { get; set; }

        public bool IsReconnect { get; set; }
    }
}
