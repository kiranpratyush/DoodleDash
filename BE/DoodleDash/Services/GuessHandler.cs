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
            if (!Rooms.TryGetValue(roomCode, out GameRoom? room))
                return;

            ChatMessages? chatMessage = null;
            Player? updatedPlayer = null;
            bool shouldBroadcastChat = false;
            bool shouldBroadcastScore = false;

            lock (GetRoomLock(roomCode))
            {
                if (!Rooms.TryGetValue(roomCode, out room) || room == null || room.IsExpired)
                    return;

                if (room.Status != GameStatus.Drawing)
                    return;

                if (!room.Players.TryGetValue(playerId, out var player))
                    return;

                if (room.ActivePlayer != null && room.ActivePlayer.Id == playerId)
                    return;

                if (room.CurrentWord == null)
                    return;

                if (room.GuessedPlayerIds.Contains(playerId))
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

                    chatMessage = new ChatMessages
                    {
                        PlayerId = player.Id,
                        PlayerName = player.Name,
                        Message = $"{player.Name} guessed the word",
                        MessageType = MessageType.System
                    };
                }
                else
                {
                    chatMessage = new ChatMessages
                    {
                        PlayerId = player.Id,
                        PlayerName = player.Name,
                        Message = guessText,
                        MessageType = MessageType.User
                    };
                }

                room.ChatMessages.Add(chatMessage);
                shouldBroadcastChat = true;
            }

            if (shouldBroadcastChat && chatMessage != null)
            {
                await hubContext.Clients.Group(roomCode).SendAsync("ReceiveChatMessage", chatMessage);
            }

            if (shouldBroadcastScore && updatedPlayer != null)
            {
                await hubContext.Clients.Group(roomCode).SendAsync("PlayerScoreUpdated", updatedPlayer);
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
