using DoodleDash.Models;
using Microsoft.AspNetCore.SignalR;

namespace DoodleDash.Services
{
    partial class RoomManager : IRoomManager
    {
        private const int ServerTimerBufferMs = 250;

        public async Task OnWordChosen(string roomCode, string playerId, string connectionId, string chosenWord)
        {
            if (!Rooms.TryGetValue(roomCode, out GameRoom? room))
                return;

            RoundStartedResponse response = new();
            RoundStartedResponse? activePlayerResponse = null;
            string? expectedRoundEndTime = null;
            bool shouldStartRound = false;
            string? activePlayerConnectionId = null;

            lock (GetRoomLock(roomCode))
            {
                if (!Rooms.TryGetValue(roomCode, out room) || room == null || room.IsExpired)
                    return;

                if (room.Status != GameStatus.SelectingWord)
                    return;

                if (room.ActivePlayer == null || room.ActivePlayer.Id != playerId || room.ActivePlayer.ConnectionId != connectionId)
                    return;

                if (room.CurrentWordOptions.Count == 0 || !room.CurrentWordOptions.Contains(chosenWord))
                    return;

                room.Status = GameStatus.Drawing;
                room.CurrentWord = chosenWord;
                room.CurrentWordHint = BuildInitialHint(chosenWord);
                room.RoundEndTime = DateTime.UtcNow.AddSeconds(room.DrawTimeSeconds)
                    .AddMilliseconds(ServerTimerBufferMs)
                    .ToString("o");
                room.SelectionEndTime = null;
                room.GuessedPlayerIds.Clear();
                room.CurrentWordOptions = [];
                room.LastRoundResult = null;

                response.Success = true;
                response.ActivePlayer = room.ActivePlayer;
                response.CurrentWordHint = room.CurrentWordHint;
                response.RoundEndTime = room.RoundEndTime;
                response.RoundNumber = room.CurrentRound;

                activePlayerResponse = new RoundStartedResponse
                {
                    Success = true,
                    ActivePlayer = room.ActivePlayer,
                    CurrentWordHint = room.CurrentWordHint,
                    RoundEndTime = room.RoundEndTime,
                    RoundNumber = room.CurrentRound,
                    CurrentWord = room.CurrentWord
                };

                activePlayerConnectionId = room.ActivePlayer.ConnectionId;
                expectedRoundEndTime = room.RoundEndTime;
                shouldStartRound = true;
            }

            if (shouldStartRound)
            {
                if (activePlayerResponse != null && activePlayerConnectionId != null)
                {
                    await hubContext.Clients.Client(activePlayerConnectionId).SendAsync("RoundStarted", activePlayerResponse);
                    await hubContext.Clients.GroupExcept(roomCode, [activePlayerConnectionId]).SendAsync("RoundStarted", response);
                }
                if (expectedRoundEndTime != null)
                {
                    _ = ScheduleRoundTimeout(roomCode, expectedRoundEndTime);
                }
            }
        }

        private static WordHint BuildInitialHint(string word)
        {
            return new WordHint
            {
                Length = word.Length,
                RevealedIndices = []
            };
        }
        private async Task ScheduleRoundTimeout(string roomCode, string expectedRoundEndTime)
        {
            if (!DateTime.TryParse(expectedRoundEndTime, null, System.Globalization.DateTimeStyles.AdjustToUniversal, out var endTime))
            {
                return;
            }

            var delay = endTime - DateTime.UtcNow;
            if (delay < TimeSpan.Zero)
                delay = TimeSpan.Zero;

            await Task.Delay(delay);

            lock (GetRoomLock(roomCode))
            {
                if (!Rooms.TryGetValue(roomCode, out var room) || room.IsExpired)
                    return;

                if (room.Status != GameStatus.Drawing || room.RoundEndTime != expectedRoundEndTime)
                    return;
            }

            await OnRoundOver(roomCode);
        }
    }
}
