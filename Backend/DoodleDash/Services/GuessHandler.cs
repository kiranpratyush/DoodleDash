using DoodleDash.Models;
using Microsoft.AspNetCore.SignalR;
using System.Text;

namespace DoodleDash.Services
{
    partial class RoomManager : IRoomManager
    {
        private const int CorrectGuessPoints = 10;

        public async Task OnGuess(string roomCode, string playerId, string connectionId, string guessText)
        {
            ChatMessage? chatMessage = null;
            Player? updatedPlayer = null;
            bool shouldBroadcastScore = false;
            bool shouldEndRound = false;

            using (var roomLock = roomStateStore.AcquireRoomLock(roomCode))
            {
                if (roomLock == null)
                    return;

                var room = roomStateStore.GetRoom(roomCode);
                if (room == null || room.IsExpired)
                    return;

                if (room.Status != GameStatus.Drawing)
                    return;

                if (!room.Players.TryGetValue(playerId, out var player))
                    return;

                if (room.ActivePlayer != null && room.ActivePlayer.Id == playerId)
                    return;

                if (room.CurrentWord == null || room.GuessedPlayerIds.Contains(playerId))
                    return;

                var normalizedGuess = NormalizeText(guessText);
                var normalizedWord = NormalizeText(room.CurrentWord);

                if (normalizedGuess.Length == 0)
                    return;

                if (normalizedGuess == normalizedWord)
                {
                    room.GuessedPlayerIds.Add(playerId);
                    player.Score += CorrectGuessPoints;
                    updatedPlayer = player;
                    shouldBroadcastScore = true;
                    shouldEndRound = room.GuessedPlayerIds.Count >= room.Players.Count - 1;

                    chatMessage = new ChatMessage
                    {
                        PlayerId = player.Id,
                        PlayerName = player.Name,
                        Message = $"{player.Name} successfully guessed the word",
                        MessageType = MessageType.System
                    };
                }
                else
                {
                    chatMessage = new ChatMessage
                    {
                        PlayerId = player.Id,
                        PlayerName = player.Name,
                        Message = guessText,
                        MessageType = MessageType.User
                    };
                }

                room.ChatMessages.Add(chatMessage);
                roomStateStore.SaveRoom(room);
            }

            if (chatMessage != null)
            {
                await hubContext.Clients.Group(roomCode).SendAsync("ReceiveChatMessage", chatMessage);
            }

            if (shouldBroadcastScore && updatedPlayer != null)
            {
                await hubContext.Clients.Group(roomCode).SendAsync("PlayerScoreUpdated", updatedPlayer);
            }

            if (shouldEndRound)
            {
                await OnRoundOver(roomCode);
            }
        }

        private static string NormalizeText(string text)
        {
            var builder = new StringBuilder(text.Length);
            foreach (var ch in text.Trim().ToLowerInvariant())
            {
                if (char.IsLetterOrDigit(ch) || char.IsWhiteSpace(ch))
                    builder.Append(ch);
            }

            return string.Join(' ', builder.ToString().Split(' ', StringSplitOptions.RemoveEmptyEntries));
        }
    }
}
