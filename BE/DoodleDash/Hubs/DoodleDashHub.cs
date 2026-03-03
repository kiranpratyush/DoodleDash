using Microsoft.AspNetCore.SignalR;
namespace DoodleDash.Hubs
{
    class DoodleDashHub : Hub
    {
        public async Task SendMessage(string user, string message)
        {
            await Clients.All.SendAsync("ReceiveMessage", user, message);
        }
    }
}