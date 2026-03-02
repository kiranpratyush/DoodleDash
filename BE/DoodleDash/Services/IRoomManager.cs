using DoodleDash.Models;

namespace DoodleDash.Services
{
    interface IRoomManager
    {
        public bool TryAddPlayer(string roomId, Player p);
    }
}