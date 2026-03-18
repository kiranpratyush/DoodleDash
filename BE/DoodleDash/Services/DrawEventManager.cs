using DoodleDash.Models;

namespace DoodleDash.Services
{
    partial class RoomManager : IRoomManager
    {
        public async Task OnDrawData(string roomCode, string playerId, List<List<float>> drawData)
        {
            if (!Rooms.TryGetValue(roomCode, out GameRoom? _))
            {
                return;
            }
            lock(GetRoomLock(roomCode)){
                if(Rooms.TryGetValue(roomCode, out GameRoom? room))
                {
                    if(room.Status == GameStatus.Drawing)
                    {
                        
                    }
                }
            }


        }
    }
}
