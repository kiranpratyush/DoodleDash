using DoodleDash.Models;
using Microsoft.AspNetCore.SignalR;

namespace DoodleDash.Services
{
    partial class RoomManager : IRoomManager
    {
        public async Task OnDrawData(string roomCode, string playerId, string connectionId, List<float> drawData)
        {
            string activeConnectionId = "";
            bool shouldSend = false;

            using (var roomLock = roomStateStore.AcquireRoomLock(roomCode))
            {
                if (roomLock == null)
                    return;

                var room = roomStateStore.GetRoom(roomCode);
                if (room == null)
                    return;

                if (room.Status == GameStatus.Drawing &&
                    room.ActivePlayer?.Id == playerId &&
                    room.ActivePlayer?.ConnectionId == connectionId &&
                    drawData.Count == 6)
                {
                    room.DrawData.Add(drawData);
                    roomStateStore.SaveRoom(room);
                    activeConnectionId = room.ActivePlayer.ConnectionId;
                    shouldSend = true;
                }
            }

            if (shouldSend)
            {
                await hubContext.Clients.GroupExcept(roomCode, [activeConnectionId]).SendAsync("OnDrawData", drawData);
            }
        }
    }
}
