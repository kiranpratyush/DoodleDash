using DoodleDash.Models;

namespace DoodleDash.Services
{
    class RoomManager : IRoomManager
    {
        // concurrent dictionary stores instance of room from room code 
        // Keep a separate concurrent dictionary to keep track of the drawing canvas
        // one lock for room dictionary 
        // one lock for canvas dictionary

        public bool TryAddPlayer(string roomId, Player p)
        {
            return false;
        }
    }
}