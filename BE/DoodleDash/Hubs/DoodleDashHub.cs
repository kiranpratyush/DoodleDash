using Microsoft.AspNetCore.SignalR;
using DoodleDash.Models;
using DoodleDash.Services;

namespace DoodleDash.Hubs
{
    class DoodleDashHub : Hub
    {
        private readonly IRoomManager roomManager;

        public DoodleDashHub(IRoomManager _roomManager)
        {
            roomManager = _roomManager;
        }

        public async Task<RoomSnapShotResponse> JoinRoom(string roomCode, string playerName,string?playerId)
        {
            return roomManager.TryAddPlayer(roomCode, playerName, playerId);
        }
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var playerId = Context.Items["PlayerId"] as string;
            var roomCode = Context.Items["RoomCode"] as string;

            if (playerId != null && roomCode != null)
            {
                roomManager.TryRemovePlayer(roomCode, playerId);
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}
