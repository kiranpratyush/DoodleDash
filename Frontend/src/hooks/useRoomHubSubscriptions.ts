import { useEffect } from 'react'
import { gameHubService } from '../services/gameHubService'
import { useGameStore } from '../store/gameStore'

export function useRoomHubSubscriptions() {
    const roomCode = useGameStore((state) => state.roomCode)
    const pendingStartGame = useGameStore((state) => state.pendingStartGame)
    const upsertPlayer = useGameStore((state) => state.upsertPlayer)
    const removePlayer = useGameStore((state) => state.removePlayer)
    const addChatMessage = useGameStore((state) => state.addChatMessage)
    const setGameStore = useGameStore((state) => state.setGameStore)
    const setOverlay = useGameStore((state) => state.setOverlay)
    const resetOverlay = useGameStore((state) => state.resetOverlay)
    const incrementCanvasClearSignal = useGameStore(
        (state) => state.incrementCanvasClearSignal
    )

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

        const cleanupStartSelection = gameHubService.onStartWordSelection(
            (options, selectionTime: number, currentRound: number) => {
                incrementCanvasClearSignal()
                setGameStore({
                    gameStatus: 'SelectingWord',
                    pendingStartGame: false,
                    currentRound: currentRound,
                    drawData: [],
                })
                setOverlay({ type: 'select', options, time: selectionTime })
            }
        )

        const cleanupGameStarted = gameHubService.onGameStarted(
            (activePlayerId, activePlayerName, drawTimeInSecond: number, currentRound: number) => {
                incrementCanvasClearSignal()
                setGameStore({
                    gameStatus: 'SelectingWord',
                    activePlayerId: activePlayerId,
                    pendingStartGame: false,
                    currentRound: currentRound,
                    drawData: [],
                })
                setOverlay({
                    type: 'waiting',
                    activePlayerName,
                    time: drawTimeInSecond,
                })
            }
        )

        const cleanupRoundStarted = gameHubService.onRoundStarted((payload) => {
            resetOverlay()
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
            setOverlay({ type: 'roundover' })
            setGameStore({
                gameStatus: 'RoundEnded',
                lastRoundResult: payload,
                currentWord: undefined,
                roundEndTime: undefined,
                activePlayerId: undefined,
            })
        })

        const cleanupGameOver = gameHubService.onGameOver((payload) => {
            setOverlay({ type: 'gameover' })
            setGameStore({
                gameStatus: 'GameEnded',
                finalResult: payload,
                currentWord: undefined,
                roundEndTime: undefined,
                activePlayerId: undefined,
            })
        })

        const cleanupReplayStarted = gameHubService.onReplayStarted(() => {
            incrementCanvasClearSignal()
            resetOverlay()
            setGameStore({
                gameStatus: 'Lobby',
                chatMessages: [],
                drawData: [],
                currentWord: undefined,
                currentWordHint: undefined,
                roundEndTime: undefined,
                selectionEndTime: undefined,
                lastRoundResult: undefined,
                finalResult: undefined,
                activePlayerId: undefined,
            })
        })

        const cleanupHintUpdated = gameHubService.onHintUpdated((payload) => {
            setGameStore({ currentWordHint: payload })
        })

        return () => {
            cleanupJoined()
            cleanupLeft()
            cleanupStartSelection()
            cleanupGameStarted()
            cleanupRoundStarted()
            cleanupReceiveChatMessage()
            cleanupPlayerScoreUpdated()
            cleanupRoundOver()
            cleanupGameOver()
            cleanupReplayStarted()
            cleanupHintUpdated()
        }
    }, [
        addChatMessage,
        incrementCanvasClearSignal,
        removePlayer,
        resetOverlay,
        setGameStore,
        setOverlay,
        upsertPlayer,
    ])

    useEffect(() => {
        if (!pendingStartGame || !roomCode) {
            return
        }

        const startPendingGame = async () => {
            try {
                await gameHubService.startGame(roomCode)
            } catch {
                setGameStore({ pendingStartGame: false })
            }
        }

        startPendingGame()
    }, [pendingStartGame, roomCode, setGameStore])
}
