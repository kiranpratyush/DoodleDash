using DoodleDash.Models;

namespace DoodleDash.Services
{
    public interface IRoomManager
    {
        public bool TryAddPlayer(string roomId, Player p);
        public GameRoom? CreateRoom(CreateRoomRequest roomRequest);

        public GameRoom? GetGameRoom(string roomCode);
    }
}