using DoodleDash.Models;
using Microsoft.AspNetCore.Mvc;

namespace DoodleDash.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RoomsController : ControllerBase
    {


        public RoomsController()
        {

        }

        [HttpGet("{roomCode}", Name = "GetRoomByCode")]
        [ProducesResponseType(StatusCodes.Status200OK, Description = "Game Room details")]
        public ActionResult<GameRoom> GetRoom(string roomCode)
        {
            return Ok(new GameRoom { RoomCode = "xxx", RoomName = "Hello", HostId = "xxx", HostName = "pratyush", MaxPlayerCount = 30 });
        }
        [HttpPost()]
        [ProducesResponseType(StatusCodes.Status201Created, Description = "Room code", StatusCode = StatusCodes.Status201Created)]
        public IActionResult CreateRooms(CreateRoomRequest roomDetails)
        {
            return CreatedAtAction(nameof(GetRoom), new { roomCode = "xxx" }, default);
        }

    }
}