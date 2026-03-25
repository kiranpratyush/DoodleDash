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
                response.RoundDrawTimeSeconds = room.DrawTimeSeconds;


                activePlayerResponse = new RoundStartedResponse
                {
                    Success = true,
                    ActivePlayer = room.ActivePlayer,
                    CurrentWordHint = room.CurrentWordHint,
                    RoundEndTime = room.RoundEndTime,
                    RoundNumber = room.CurrentRound,
                    CurrentWord = room.CurrentWord,
                    RoundDrawTimeSeconds = room.DrawTimeSeconds
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
                    _ = ScheduleHintReveal(roomCode, expectedRoundEndTime);
                }
            }
        }

        private static WordHint BuildInitialHint(string word)
        {
            var RevealedIndices = word
                .Select((ch, index) => new Hint { Character =ch, Index = index })
                .Where(x => x.Character == ' ')
                .ToList();
            return new WordHint
            {
                Length = word.Length,
                RevealedIndices = RevealedIndices
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

        private async Task ScheduleHintReveal(string roomCode, string expectedRoundEndTime)
        {
            if (!DateTime.TryParse(expectedRoundEndTime, null, System.Globalization.DateTimeStyles.AdjustToUniversal, out var endTime))
            {
                return;
            }

            while (DateTime.UtcNow < endTime)
            {
                await Task.Delay(TimeSpan.FromSeconds(GameConstants.HintIntervalSeconds));

                WordHint? updatedHint = null;

                lock (GetRoomLock(roomCode))
                {
                    if (!Rooms.TryGetValue(roomCode, out var room) || room.IsExpired)
                        return;

                    if (room.Status != GameStatus.Drawing || room.RoundEndTime != expectedRoundEndTime)
                        return;

                    if (room.CurrentWord != null && room.CurrentWordHint != null)
                    {
                        var revealedCount = room.CurrentWordHint.RevealedIndices.Count(h => h.Character != ' ');
                        if (revealedCount >= GameConstants.MaxHintsPerRound)
                        {
                            return; // Stop timer if we've reached the max hints
                        }

                        var revealedIndices = room.CurrentWordHint.RevealedIndices.Select(h => h.Index);
                        var hiddenIndices = Enumerable.Range(0, room.CurrentWord.Length)
                            .Where(i => room.CurrentWord[i] != ' ')
                            .Except(revealedIndices)
                            .ToList();

                        if (hiddenIndices.Count > 1) 
                        {
                            int randPos = new Random().Next(hiddenIndices.Count);
                            int randomIndex = hiddenIndices[randPos];
                            
                            var newHint = new Hint { Character = room.CurrentWord[randomIndex], Index = randomIndex };
                            room.CurrentWordHint.RevealedIndices.Add(newHint);
                            updatedHint = room.CurrentWordHint;
                        }
                        else
                        {
                            return; 
                        }
                    }
                }

                if (updatedHint != null)
                {
                    await hubContext.Clients.Group(roomCode).SendAsync("HintUpdated", updatedHint);
                }
            }
        }
    }
}
