using Microsoft.AspNetCore.SignalR;
using DoodleDash.Models;
using DoodleDash.Services;
using System.Collections.Concurrent;

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
            var response =  roomManager.TryAddPlayer(roomCode, playerName,Context.ConnectionId,playerId);
            if (response.Success)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);
                await Clients.GroupExcept(roomCode, Context.ConnectionId).SendAsync("PlayerJoined", response.Player);
            }
            Context.Items["PlayerId"] =response.Player?.Id;
            Context.Items["RoomCode"] = roomCode;

            return response;

        }

        public async Task<RoomSnapShotResponse> onWordChosen(string word)
        {
            var roomCode = Context.Items["RoomCode"] as string ?? "";

            var response = await roomManager.TryOnWordChosen(roomCode, word, Context.ConnectionId);
             _ = Task.Run(async () =>
            {
                await Task.Delay(response.SnapShotResponse?.RoundEndTime - DateTime.UtcNow ?? TimeSpan.Zero);
                await roomManager.OnRoundOver(roomCode);
            });

            return response;


        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            string? playerId = Context.Items["PlayerId"] as string;
            string? roomCode = Context.Items["RoomCode"] as string;

            if (playerId != null && roomCode != null)
            {
                roomManager.TryRemovePlayer(roomCode, playerId);
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}
