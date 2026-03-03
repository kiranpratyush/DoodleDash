using DoodleDash.Models;
using DoodleDash.Services;
using Microsoft.AspNetCore.Mvc;

namespace DoodleDash.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RoomsController : ControllerBase
    {
        private readonly IRoomManager roomMangager;


        public RoomsController(IRoomManager _roomManager)
        {
            roomMangager = _roomManager;
        }

        [HttpGet("{roomCode}", Name = "GetRoomByCode")]
        [ProducesResponseType(StatusCodes.Status200OK, Description = "Game Room details")]
        public ActionResult<GameRoom> GetRoom(string roomCode)
        {
            var gameRoom = roomMangager.GetGameRoom(roomCode);
            if (gameRoom == null) return Ok(null);
            return Ok(new GameRoom
            {
                RoomCode = gameRoom.RoomCode,
                RoomName = gameRoom.RoomName,
                HostId = gameRoom.HostId,
                HostName = gameRoom.HostName,
                MaxPlayerCount = gameRoom.MaxPlayerCount
            });
        }
        [HttpPost()]
        [ProducesResponseType(StatusCodes.Status201Created, Description = "Room code", StatusCode = StatusCodes.Status201Created)]
        public IActionResult CreateRooms(CreateRoomRequest roomDetails)
        {
            var gameRoom = roomMangager.CreateRoom(roomDetails);
            if (gameRoom != null)
                return CreatedAtAction(nameof(GetRoom), new { roomCode = gameRoom.RoomCode }, default);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }

    }
}