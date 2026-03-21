import { useState } from 'react'
import { PaperAirplaneIcon } from '@heroicons/react/20/solid'
import { useGameStore } from '../store/gameStore'
import { gameHubService } from '../services/gameHubService'

export function Guess() {
    const [guess, setGuess] = useState('')
    const chatMessages = useGameStore((state) => state.chatMessages)
    const roomCode = useGameStore((state) => state.roomCode)

    async function handleSend() {
        const guessText = guess.trim()
        if (!guessText || !roomCode) {
            return
        }

        try {
            await gameHubService.guessWord(roomCode, guessText)
            setGuess('')
        } catch (error) {
            console.error('Failed to send guess', error)
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            void handleSend()
        }
    }

    return (
        <div className="h-full bg-gray-100 rounded-sm p-4 flex flex-col">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Send your guesses
            </h2>
            <div className="flex-1 overflow-y-auto space-y-2">
                {chatMessages.map((message, index) => {
                    const isSystem = message.messageType === 'System'
                    return (
                        <div
                            key={`${message.playerId}-${index}`}
                            className={`p-2 rounded-sm text-sm ${isSystem ? 'bg-emerald-50 text-emerald-800 italic text-center' : 'bg-white text-gray-600'}`}
                        >
                            {isSystem ? (
                                message.message
                            ) : (
                                <>
                                    <span className="font-medium text-gray-800">
                                        {message.playerName}:
                                    </span>{' '}
                                    {message.message}
                                </>
                            )}
                        </div>
                    )
                })}
            </div>
            <div className="mt-4 flex gap-2">
                <input
                    type="text"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your guess..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-900 text-sm"
                />
                <button
                    onClick={() => void handleSend()}
                    className="px-4 py-2 bg-emerald-900 text-white rounded-sm hover:bg-emerald-400 transition-colors flex items-center"
                >
                    <PaperAirplaneIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    )
}
