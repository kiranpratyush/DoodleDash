using DoodleDash.Models;

namespace DoodleDash.Services
{
    public interface IRoomManager
    {
        public RoomSnapShotResponse TryAddPlayer(string roomCode, string playerName, string connectionId,string?playerId);
        public bool TryRemovePlayer(string roomCode, string playerId);
        public GameRoom? CreateRoom(CreateRoomRequest roomRequest);

        public GameRoom? GetGameRoom(string roomCode);

        public bool TryStartGame(string roomCode, string hostId);

        public bool TrySelectWord(string roomCode, string playerId, int wordIndex);

        public bool TrySubmitGuess(string roomCode, string playerId, string guess, out bool isCorrect, out int pointsAwarded);
    }
}