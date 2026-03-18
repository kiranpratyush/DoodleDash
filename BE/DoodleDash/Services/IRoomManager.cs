using DoodleDash.Models;

namespace DoodleDash.Services
{
    public interface IRoomManager
    {
        RoomSnapShotResponse TryAddPlayer(string roomCode, string playerName, string connectionId,string?playerId);
        bool TryRemovePlayer(string roomCode, string playerId);
        GameRoom? CreateRoom(CreateRoomRequest roomRequest);
        Task StartGame(string roomCode);

        Task OnDrawData(string roomCode, string playerId, string connectionId, List<float> drawData);
    }
}
