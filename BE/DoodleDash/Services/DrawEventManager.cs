using DoodleDash.Models;
using Microsoft.AspNetCore.SignalR;

namespace DoodleDash.Services
{
    partial class RoomManager : IRoomManager
    {
        public async Task OnDrawData(string roomCode, string playerId, string connectionId, List<float> drawData)
        {
            if (!Rooms.TryGetValue(roomCode, out GameRoom? _))
            {
                return;
            }
            string activeConnectionId = "";
            bool shouldSend = false;
            lock(GetRoomLock(roomCode)){
                if(Rooms.TryGetValue(roomCode, out GameRoom? room))
                {
                    if(room.Status == GameStatus.Drawing &&
                        room.ActivePlayer?.Id == playerId &&
                        room.ActivePlayer?.ConnectionId == connectionId &&
                        drawData.Count == 6)
                    {
                        var history = CanvasHistory.GetOrAdd(roomCode, _ => new List<List<float>>());
                        history.Add(drawData);
                        activeConnectionId = room.ActivePlayer.ConnectionId;
                        shouldSend = true;
                    }
                }
            }
            if(shouldSend)
            {
                await hubContext.Clients.GroupExcept(roomCode,[activeConnectionId]).SendAsync("OnDrawData",drawData);
            }

        }
    }
}
