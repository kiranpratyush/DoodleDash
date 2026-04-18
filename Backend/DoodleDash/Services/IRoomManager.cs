using DoodleDash.Models;

namespace DoodleDash.Services
{
    public interface IRoomManager
    {
        GameRoom? GetRoom(string roomCode);
        RoomSnapShotResponse TryAddPlayer(string roomCode, string playerName, string connectionId,string?playerId);
        Player? TryRemovePlayer(string roomCode, string playerId);
        GameRoom? CreateRoom(CreateRoomRequest roomRequest);
        Task StartGame(string roomCode);

        Task OnDrawData(string roomCode, string playerId, string connectionId, List<float> drawData);

        Task OnWordChosen(string roomCode, string playerId, string connectionId, string chosenWord);

        Task OnGuess(string roomCode, string playerId, string connectionId, string guessText);

        Task ReplayGame(string roomCode, string playerId, string connectionId);
    }
}
