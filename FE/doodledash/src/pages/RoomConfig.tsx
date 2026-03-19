import { useState } from 'react'
import { DoodleDashButton } from '../design-system/button'
import { DoodleDashInput } from '../design-system/input'
import { useLocalInputs } from '../store/inputStore'
import { useGameStore } from '../store/gameStore'
import { createRoom } from '../services/gameService'

export default function GameConfig() {
    const setMaxPlayers = useLocalInputs((state) => state.setMaxPlayers)
    const setTotalRounds = useLocalInputs((state) => state.setMaxRounds)
    const setDrawTime = useLocalInputs((state) => state.setDrawTime)
    const setCustomWords = useLocalInputs((state) => state.setCustomWords)
    const localInputs = useLocalInputs((state) => state.localInputs)
    const setCurrentScreen = useLocalInputs((state) => state.setCurrentScreen)
    const roomConfig = useGameStore((state) => state.roomConfig)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const ensureRoomExists = async (
        forceNew: boolean
    ): Promise<string | null> => {
        if (!forceNew && roomConfig?.roomCode) {
            return roomConfig.roomCode
        }

        setError(null)
        setIsLoading(true)

        const response = await createRoom({
            playerName: localInputs.playerName || 'Host',
            maxAllowedPlayers: localInputs.maxPlayers,
            totalRounds: localInputs.maxRounds,
            drawTimeSeconds: localInputs.drawTimeInSecond,
            customWords: localInputs.customWords,
        })

        if (response.isSuccess) {
            const playerName = localInputs.playerName || 'Host'
            useGameStore
                .getState()
                .setRoomDetails(
                    response.data.roomCode,
                    response.data.playerId,
                    playerName
                )
            return response.data.roomCode
        } else {
            setError(response.error.errorMessage)
            return null
        }
    }

    const handleStartGameButton = async () => {
        const roomCode = await ensureRoomExists(false)
        setIsLoading(false)
        if (roomCode) {
            setCurrentScreen('ROOM')
        }
    }

    const handleInviteGameButton = async () => {
        const currentRoomCode = await ensureRoomExists(false)
        setIsLoading(false)

        if (currentRoomCode) {
            const inviteUrl = `${window.location.origin}/${currentRoomCode}`
            try {
                await navigator.clipboard.writeText(inviteUrl)
                alert('Invite link copied to clipboard!')
            } catch (err) {
                console.error('Failed to copy text: ', err)
                setError('Failed to copy invite link.')
            }
        }
    }

    const data = [
        {
            type: 'Max Allowed Players',
            data: useLocalInputs((state) => state.localInputs.maxPlayers),
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                setMaxPlayers(parseInt(event.target.value))
            },
        },
        {
            type: 'Total Rounds',
            data: useLocalInputs((state) => state.localInputs.maxRounds),
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                setTotalRounds(parseInt(event.target.value))
            },
        },
        {
            type: 'Draw Time (seconds)',
            data: useLocalInputs((state) => state.localInputs.drawTimeInSecond),
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                setDrawTime(parseInt(event.target.value))
            },
        },
    ]

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg p-8 rounded-lg shadow-xl">
                <h1 className="text-2xl font-bold text-gray-800 mb-8 text-center">
                    Game Settings
                </h1>
                <div className="flex flex-col gap-6">
                    {data.map((d) => {
                        return (
                            <div key={d.type} className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-700">
                                    {d.type}
                                </label>
                                <DoodleDashInput
                                    type="number"
                                    placeHolder=""
                                    onChange={d.onChange}
                                    value={d.data.toString()}
                                />
                            </div>
                        )
                    })}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">
                            Custom Words
                        </label>
                        <textarea
                            className="h-32 w-full p-2 border-2 border-emerald-400 rounded-sm outline-emerald-600 resize-none text-lg"
                            placeholder="Enter words separated by commas..."
                            onChange={(
                                event: React.ChangeEvent<HTMLTextAreaElement>
                            ) => {
                                setCustomWords(event.target.value)
                            }}
                        />
                    </div>
                    <DoodleDashButton
                        size="l"
                        label={isLoading ? 'Starting...' : 'Start Game'}
                        onClick={handleStartGameButton}
                    />
                    {error && (
                        <p className="text-red-500 text-center text-sm">
                            {error}
                        </p>
                    )}
                    <DoodleDashButton
                        size="l"
                        label="Invite"
                        onClick={handleInviteGameButton}
                    />
                </div>
            </div>
        </div>
    )
}
