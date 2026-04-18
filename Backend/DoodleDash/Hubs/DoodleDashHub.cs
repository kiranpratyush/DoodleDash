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

        public async Task<RoomSnapShotResponse> JoinRoom(string roomCode, string playerName, string? playerId)
        {
            var response = roomManager.TryAddPlayer(roomCode, playerName, Context.ConnectionId, playerId);
            if (response.Success)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);
                if (!response.IsReconnect)
                {
                    await Clients.GroupExcept(roomCode, Context.ConnectionId).SendAsync("PlayerJoined", response.Player);
                }
            }
            Context.Items["PlayerId"] = response.Player?.Id;
            Context.Items["RoomCode"] = roomCode;

            return response;

        }

        public async Task OnDrawData(string roomCode, string playerId, List<float> drawData)
        {
            await roomManager.OnDrawData(roomCode, playerId, Context.ConnectionId, drawData);
        }

        public async Task ChooseWord(string roomCode, string chosenWord)
        {
            string? playerId = Context.Items["PlayerId"] as string;
            if (playerId == null)
                return;

            await roomManager.OnWordChosen(roomCode, playerId, Context.ConnectionId, chosenWord);
        }

        public async Task GuessWord(string roomCode, string guessText)
        {
            string? playerId = Context.Items["PlayerId"] as string;
            if (playerId == null)
                return;

            await roomManager.OnGuess(roomCode, playerId, Context.ConnectionId, guessText);
        }

        public async Task StartGame(string roomCode)
        {
            await roomManager.StartGame(roomCode);
        }

        public async Task ReplayGame(string roomCode)
        {
            string? playerId = Context.Items["PlayerId"] as string;
            if (playerId == null)
                return;

            await roomManager.ReplayGame(roomCode, playerId, Context.ConnectionId);
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            string? playerId = Context.Items["PlayerId"] as string;
            string? roomCode = Context.Items["RoomCode"] as string;

            if (playerId != null && roomCode != null)
            {
                var removedPlayer = roomManager.TryRemovePlayer(roomCode, playerId);
                if (removedPlayer != null)
                {
                    await Clients.Group(roomCode).SendAsync("PlayerLeft", removedPlayer);
                }
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}
