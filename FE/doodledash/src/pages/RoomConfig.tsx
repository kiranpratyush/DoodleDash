import { useEffect, useRef, useState } from 'react'
import { DoodleDashButton } from '../design-system/button'
import { DoodleDashInput } from '../design-system/input'
import { useLocalInputs } from '../store/inputStore'
import { useGameStore } from '../store/gameStore'
import { createRoom } from '../services/gameService'
import { gameHubService } from '../services/gameHubService'

export default function GameConfig() {
    const setMaxPlayers = useLocalInputs((state) => state.setMaxPlayers)
    const setTotalRounds = useLocalInputs((state) => state.setMaxRounds)
    const setDrawTime = useLocalInputs((state) => state.setDrawTime)
    const setCustomWords = useLocalInputs((state) => state.setCustomWords)
    const localInputs = useLocalInputs((state) => state.localInputs)
    const setCurrentScreen = useLocalInputs((state) => state.setCurrentScreen)
    const players = useGameStore((state) => state.players)
    const chatMessages = useGameStore((state) => state.chatMessages)
    const applyRoomSnapshot = useGameStore((state) => state.applyRoomSnapshot)
    const setGameStore = useGameStore((state) => state.setGameStore)
    const upsertPlayer = useGameStore((state) => state.upsertPlayer)
    const removePlayer = useGameStore((state) => state.removePlayer)
    const addChatMessage = useGameStore((state) => state.addChatMessage)
    const roomCode = useGameStore((state) => state.roomCode)
    const activePlayer = useGameStore((state) => state.currentPlayer)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const hasJoinedRef = useRef(false)

    const handleCreateRoomButton = async () => {
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
            const playerName = response.data.playerName || 'Host'
            setGameStore({
                currentPlayer: {
                    name: playerName,
                    id: response.data.playerId,
                },
                roomCode: response.data.roomCode,
            })
            setIsLoading(false)
            return
        } else {
            setError(response.error.errorMessage)
            setIsLoading(false)
            return
        }
    }

    const handleStartGameButton = async () => {
        if (!roomCode) {
            return
        }
        setIsLoading(true)
        setError(null)
        setGameStore({ pendingStartGame: true })
        setCurrentScreen('ROOM')
    }

    const handleInviteGameButton = async () => {
        if (!roomCode) {
            setError('Create a room first to invite players.')
            return
        }

        const inviteUrl = `${window.location.origin}/${roomCode}`
        try {
            await navigator.clipboard.writeText(inviteUrl)
            alert('Invite link copied to clipboard!')
        } catch (err) {
            console.error('Failed to copy text: ', err)
            setError('Failed to copy invite link.')
        }
    }

    useEffect(() => {
        const joinRoom = async () => {
            if (hasJoinedRef.current) {
                return
            }
            if (!roomCode) {
                return
            }
            const playerName = activePlayer
                ? activePlayer.name
                : localInputs.playerName
            const playerId = activePlayer ? activePlayer.id : undefined

            const joinResponse = await gameHubService.joinRoom(
                roomCode,
                playerName || '',
                playerId
            )
            if (joinResponse.success) {
                hasJoinedRef.current = true
                setGameStore({ roomCode: roomCode })
                applyRoomSnapshot(joinResponse)
            } else {
                setError(joinResponse.errorMessage || 'Failed to join room.')
            }
        }

        joinRoom()
    }, [applyRoomSnapshot, setGameStore, roomCode])

    useEffect(() => {
        const cleanupJoined = gameHubService.onPlayerJoined((player) => {
            if (!player) {
                return
            }
            upsertPlayer(player)
            addChatMessage({
                playerId: 'system',
                playerName: 'System',
                message: `${player.name} joined`,
                messageType: 'System',
            })
        })

        const cleanupLeft = gameHubService.onPlayerLeft((player) => {
            if (!player) {
                return
            }
            removePlayer(player.id)
            addChatMessage({
                playerId: 'system',
                playerName: 'System',
                message: `${player.name} left`,
                messageType: 'System',
            })
        })

        return () => {
            cleanupJoined()
            cleanupLeft()
        }
    }, [addChatMessage, removePlayer, upsertPlayer])

    const systemMessages = chatMessages.filter(
        (message) => message.messageType === 'System'
    )
    const canStartGame = players.length >= 2 && !!roomCode
    const canInvite = !!roomCode
    const isConfigLocked = !!roomCode

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
            <div className="w-full max-w-4xl flex flex-col gap-6 lg:flex-row">
                <div className="bg-white w-full lg:max-w-lg p-8 rounded-lg shadow-xl">
                    <h1 className="text-2xl font-bold text-gray-800 mb-8 text-center">
                        Game Settings
                    </h1>
                    <div className="flex flex-col gap-6">
                        {data.map((d) => {
                            return (
                                <div
                                    key={d.type}
                                    className="flex flex-col gap-2"
                                >
                                    <label className="text-sm font-medium text-gray-700">
                                        {d.type}
                                    </label>
                                    <DoodleDashInput
                                        type="number"
                                        placeHolder=""
                                        onChange={d.onChange}
                                        value={d.data.toString()}
                                        disabled={isConfigLocked}
                                    />
                                </div>
                            )
                        })}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-700">
                                Custom Words
                            </label>
                            <textarea
                                className={`h-32 w-full p-2 border-2 rounded-sm resize-none text-lg ${
                                    isConfigLocked
                                        ? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed'
                                        : 'border-emerald-400 outline-emerald-600'
                                }`}
                                placeholder="Enter words separated by commas..."
                                onChange={(
                                    event: React.ChangeEvent<HTMLTextAreaElement>
                                ) => {
                                    setCustomWords(event.target.value)
                                }}
                                disabled={isConfigLocked}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            {roomCode ? (
                                <>
                                    <DoodleDashButton
                                        size="l"
                                        label="Start Game"
                                        isLoading={isLoading}
                                        isLoadingLabel="Starting..."
                                        onClick={handleStartGameButton}
                                        disabled={!canStartGame}
                                    />
                                    {!canStartGame && (
                                        <p className="text-sm text-gray-500 text-center">
                                            Need at least 2 players to start.
                                        </p>
                                    )}
                                </>
                            ) : (
                                <DoodleDashButton
                                    size="l"
                                    label="Create Room"
                                    isLoading={isLoading}
                                    isLoadingLabel="Creating..."
                                    onClick={handleCreateRoomButton}
                                />
                            )}
                        </div>
                        {error && (
                            <p className="text-red-500 text-center text-sm">
                                {error}
                            </p>
                        )}
                        <DoodleDashButton
                            size="l"
                            label="Invite"
                            onClick={handleInviteGameButton}
                            disabled={!canInvite}
                        />
                    </div>
                </div>
                <div className="bg-white w-full lg:max-w-sm p-6 rounded-lg shadow-xl">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                        Lobby
                    </h2>
                    <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-600 mb-2">
                            Players ({players.length})
                        </h3>
                        <div className="space-y-2">
                            {players.length === 0 && (
                                <p className="text-sm text-gray-500">
                                    Waiting for players...
                                </p>
                            )}
                            {players.map((player) => (
                                <div
                                    key={player.id}
                                    className="flex items-center justify-between bg-gray-50 p-2 rounded-sm"
                                >
                                    <span className="text-sm text-gray-800">
                                        {player.name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {player.score}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-600 mb-2">
                            Activity
                        </h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {systemMessages.length === 0 && (
                                <p className="text-sm text-gray-500">
                                    No activity yet.
                                </p>
                            )}
                            {systemMessages.map((message, index) => (
                                <div
                                    key={`${message.playerId}-${index}`}
                                    className="text-sm text-gray-700 bg-emerald-50 p-2 rounded-sm"
                                >
                                    {message.message}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
