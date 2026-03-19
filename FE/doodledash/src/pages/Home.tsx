import { DoodleDashButton } from '../design-system/button'
import { DoodleDashInput } from '../design-system/input'
import { useLocalInputs } from '../store/inputStore'
import { useGameStore } from '../store/gameStore'
import { gameHubService } from '../services/gameHubService'
import { useState } from 'react'

export default function Home() {
    const playerName = useLocalInputs((state) => state.localInputs.playerName)
    const setPlayerName = useLocalInputs((state) => state.setPlayerName)
    const setCurrentScreen = useLocalInputs((state) => state.setCurrentScreen)
    const setGameStore = useGameStore((state) => state.setGameStore)
    const applyRoomSnapshot = useGameStore((state) => state.applyRoomSnapshot)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const roomCodeFromUrl = window.location.pathname.slice(1) || null

    async function handleButtonClicked() {
        if (playerName?.length && playerName.length > 0) {
            if (roomCodeFromUrl) {
                setIsLoading(true)
                setError(null)
                const joinResponse = await gameHubService.joinRoom(
                    roomCodeFromUrl,
                    playerName
                )
                if (joinResponse.success) {
                    setGameStore({ roomCode: roomCodeFromUrl })
                    applyRoomSnapshot(joinResponse)
                    setCurrentScreen('ROOM')
                } else {
                    setError(joinResponse.errorMessage || 'Failed to join room.')
                }
                setIsLoading(false)
            } else {
                setCurrentScreen('GAMECONFIG')
            }
        }
    }

    return (
        <div className="gradient-bg min-h-screen flex items-center justify-center p-4">
            <div className="bg-white/90 backdrop-blur-sm w-full max-w-md p-8 rounded-xl shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        DoodleDash
                    </h1>
                    <p className="text-gray-600">
                        Draw, guess, and have fun with friends!
                    </p>
                </div>
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">
                            Your Name
                        </label>
                        <DoodleDashInput
                            placeHolder="Enter your name"
                            type="text"
                            onChange={(
                                event: React.ChangeEvent<HTMLInputElement>
                            ) => {
                                setPlayerName(event.target.value)
                            }}
                            value={playerName}
                        />
                    </div>
                    <div className="flex flex-col gap-3">
                        <DoodleDashButton
                            size="l"
                            label={
                                roomCodeFromUrl ? 'Join Room' : 'Create Room'
                            }
                            isLoading={isLoading}
                            isLoadingLabel="Joining..."
                            onClick={handleButtonClicked}
                        />
                        {error && (
                            <p className="text-red-500 text-center text-sm">
                                {error}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
