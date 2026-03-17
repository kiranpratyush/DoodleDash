using Microsoft.AspNetCore.SignalR;
using DoodleDash.Models;
using DoodleDash.Services;
using System.Collections.Concurrent;

namespace DoodleDash.Hubs
{
    class DoodleDashHub : Hub
    {
        private readonly IRoomManager roomManager;

        private readonly ConcurrentDictionary<string, string> connectionIdToPlayerId = new();

        public DoodleDashHub(IRoomManager _roomManager)
        {
            roomManager = _roomManager;
        }

        public async Task<RoomSnapShotResponse> JoinRoom(string roomCode, string playerName,string?playerId)
        {
           
            var response =  roomManager.TryAddPlayer(roomCode, playerName,Context.ConnectionId,playerId);
            if (response.Success)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);
                connectionIdToPlayerId[Context.ConnectionId] = response.Player != null ? response.Player.Id : string.Empty;
                await Clients.GroupExcept(roomCode, Context.ConnectionId).SendAsync("PlayerJoined", response.Player);
            }
           
            return response;

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
