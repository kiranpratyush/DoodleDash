import { useEffect, useState } from 'react'
import { Canvas, type Props as CanvasProps } from '../components/canvas'
import {
    ColorPicker,
    type Props as ColorPickerProps,
} from '../components/colorPicker'
import { Player } from '../components/player'
import { Guess } from '../components/guess'
import { GuessWord } from '../components/guessWord'
import { Timer } from '../components/timer'
import { useGameStore } from '../store/gameStore'
import { gameHubService } from '../services/gameHubService'
import { WordPicker, WaitingForWordToBeChoosen } from '../components/WordPicker'

type OverlayState =
    | { type: 'default'; options: CanvasProps & ColorPickerProps }
    | { type: 'select'; options: string[]; time: number }
    | { type: 'waiting'; activePlayerName: string; time: number }

function RenderOverlay(overlay: OverlayState) {
    switch (overlay.type) {
        case 'select':
            return (
                <WordPicker wordOptions={overlay.options} time={overlay.time} />
            )
        case 'waiting':
            return (
                <WaitingForWordToBeChoosen
                    playerName={overlay.activePlayerName}
                    time={overlay.time}
                />
            )
        case 'default':
            return
    }
}

export default function Room() {
    const [color, setColor] = useState('#000000')
    const [brushSize] = useState(3)
    const roomCode = useGameStore((state) => state.roomCode)
    const gameStatus = useGameStore((state) => state.gameStatus)
    const activePlayerId = useGameStore((state) => state.activePlayerId)
    const pendingStartGame = useGameStore((state) => state.pendingStartGame)
    const upsertPlayer = useGameStore((state) => state.upsertPlayer)
    const removePlayer = useGameStore((state) => state.removePlayer)
    const addChatMessage = useGameStore((state) => state.addChatMessage)
    const setGameStore = useGameStore((state) => state.setGameStore)
    const currentPlayer = useGameStore((state) => state.currentPlayer)
    const roundEndTime = useGameStore((state) => state.roundEndTime)
    const roundDrawTimeSeconds = useGameStore((state) => state.drawTimeSeconds)
    const defaultOverlayOptions = {
        color: color,
        setActiveColor: setColor,
        throttleInMs: 50,
        isDrawingAllowed: false,
        brushSize: brushSize,
        activeColor: color,
    }
    const [overlay, setOverlay] = useState<OverlayState>({
        type: 'default',
        options: defaultOverlayOptions,
    })

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

    useEffect(() => {
        const cleanupStartSelection = gameHubService.onStartWordSelection(
            (options, selectionTime: number) => {
                setGameStore({
                    gameStatus: 'SelectingWord',
                    pendingStartGame: false,
                })
                setOverlay({ type: 'select', options, time: selectionTime })
            }
        )
        const cleanupGameStarted = gameHubService.onGameStarted(
            (activePlayerId, activePlayerName, drawTimeInSecond: number) => {
                setGameStore({
                    gameStatus: 'SelectingWord',
                    activePlayerId: activePlayerId,
                    pendingStartGame: false,
                })
                setOverlay({
                    type: 'waiting',
                    activePlayerName,
                    time: drawTimeInSecond,
                })
            }
        )
        const cleanupRoundStarted = gameHubService.onRoundStarted((payload) => {
            setOverlay({ type: 'default', options: defaultOverlayOptions })
            setGameStore({
                gameStatus: 'Drawing',
                currentWordHint: payload.currentWordHint,
                roundEndTime: payload.roundEndTime,
                currentRound: payload.roundNumber,
                currentWord: payload.currentWord,
                drawTimeSeconds: payload.roundDrawTimeSeconds,
                activePlayerId: payload.activePlayer?.id,
            })
        })
        const cleanupReceiveChatMessage = gameHubService.onReceiveChatMessage(
            (payload) => {
                addChatMessage(payload)
            }
        )
        const cleanupPlayerScoreUpdated = gameHubService.onPlayerScoreUpdated(
            (payload) => {
                upsertPlayer(payload)
            }
        )
        const cleanupRoundOver = gameHubService.onRoundOver((payload) => {
            setOverlay({ type: 'default', options: defaultOverlayOptions })
            setGameStore({
                gameStatus: 'RoundEnded',
                lastRoundResult: payload,
                currentWord: undefined,
                roundEndTime: undefined,
                activePlayerId: undefined,
            })
        })
        const cleanupGameOver = gameHubService.onGameOver((payload) => {
            setOverlay({ type: 'default', options: defaultOverlayOptions })
            setGameStore({
                gameStatus: 'GameEnded',
                finalResult: payload,
                currentWord: undefined,
                roundEndTime: undefined,
                activePlayerId: undefined,
            })
        })

        return () => {
            cleanupStartSelection()
            cleanupGameStarted()
            cleanupRoundStarted()
            cleanupReceiveChatMessage()
            cleanupPlayerScoreUpdated()
            cleanupRoundOver()
            cleanupGameOver()
        }
    }, [addChatMessage, setGameStore, upsertPlayer])

    useEffect(() => {
        if (!pendingStartGame || !roomCode) {
            return
        }

        const startPendingGame = async () => {
            try {
                await gameHubService.startGame(roomCode)
            } catch (err) {
                console.error('Failed to start game:', err)
                setGameStore({ pendingStartGame: false })
            }
        }

        startPendingGame()
    }, [pendingStartGame, roomCode, setGameStore])

    return (
        <div className="flex flex-col gradient-bg">
            <h1 className="text-3xl font-bold text-center mb-6 text-gray-700 self-center">
                Doodle Dash
            </h1>
            <div className="flex items-center justify-center gap-4 mb-4">
                {gameStatus == 'Drawing' && (
                    <>
                        <Timer
                            endTimeIso={roundEndTime}
                            timeCount={roundDrawTimeSeconds}
                        />
                        <GuessWord />
                    </>
                )}
            </div>
            <div className="h-screen flex pt-4 px-4 gap-4">
                <div className="flex-1 max-h-[70%]">
                    <Player />
                </div>
                <div className="flex flex-col h-[80vh] rounded-sm flex-3 relative">
                    <Canvas
                        color={color}
                        brushSize={brushSize}
                        isDrawingAllowed={
                            gameStatus == 'Drawing' &&
                            activePlayerId != undefined &&
                            currentPlayer?.id == activePlayerId
                        }
                        throttleInMs={50}
                    />
                    <ColorPicker
                        activeColor={color}
                        setActiveColor={setColor}
                    />
                    {overlay.type != 'default' && (
                        <div className="absolute h-full w-full">
                            {RenderOverlay(overlay)}
                        </div>
                    )}
                </div>
                <div className="flex-1 max-h-[70%]">
                    <Guess />
                </div>
            </div>
        </div>
    )
}
