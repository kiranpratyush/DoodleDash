import { useEffect, useMemo, useState } from 'react'
import { Canvas } from '../components/canvas'
import { ColorPicker } from '../components/colorPicker'
import { Player } from '../components/player'
import { Guess } from '../components/guess'
import { GuessWord } from '../components/guessWord'
import { Timer } from '../components/timer'
import { useGameStore } from '../store/gameStore'
import { gameHubService } from '../services/gameHubService'

type OverlayState =
    | { type: 'none' }
    | { type: 'select'; options: string[] }
    | { type: 'waiting'; activePlayerName: string }

export default function Room() {
    const [color, setColor] = useState('#000000')
    const [brushSize] = useState(3)
    const upsertPlayer = useGameStore((state) => state.upsertPlayer)
    const removePlayer = useGameStore((state) => state.removePlayer)
    const addChatMessage = useGameStore((state) => state.addChatMessage)
    const setGameStore = useGameStore((state) => state.setGameStore)
    const roomCode = useGameStore((state) => state.roomCode)
    const currentPlayer = useGameStore((state) => state.currentPlayer)
    const activePlayer = useGameStore((state) => state.activePlayer)
    const currentWordHint = useGameStore((state) => state.currentWordHint)
    const currentWord = useGameStore((state) => state.currentWord)
    const roundEndTime = useGameStore((state) => state.roundEndTime)
    const selectionEndTime = useGameStore((state) => state.selectionEndTime)
    const [overlay, setOverlay] = useState<OverlayState>({ type: 'none' })
    const [selectionLocked, setSelectionLocked] = useState(false)

    useEffect(() => {
        const cleanupJoined = gameHubService.onPlayerJoined((player) => {
            console.log(player)
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
            (options) => {
                setSelectionLocked(false)
                setOverlay({ type: 'select', options })
            }
        )
        const cleanupGameStarted = gameHubService.onGameStarted(
            (activePlayerId, activePlayerName) => {
                setGameStore({
                    gameStatus: 'SelectingWord',
                    activePlayer: {
                        id: activePlayerId,
                        name: activePlayerName,
                        connectionId: '',
                        score: 0,
                    },
                })
                if (currentPlayer?.id !== activePlayerId) {
                    setOverlay({ type: 'waiting', activePlayerName })
                }
            }
        )
        const cleanupRoundStarted = gameHubService.onRoundStarted((payload) => {
            setOverlay({ type: 'none' })
            setSelectionLocked(false)
            setGameStore({
                gameStatus: 'Drawing',
                activePlayer: payload.activePlayer,
                currentWordHint: payload.currentWordHint,
                roundEndTime: payload.roundEndTime,
                currentRound: payload.roundNumber,
                currentWord: payload.currentWord,
            })
        })

        return () => {
            cleanupStartSelection()
            cleanupGameStarted()
            cleanupRoundStarted()
        }
    }, [currentPlayer?.id, setGameStore])

    const handleChooseWord = async (word: string) => {
        if (!roomCode || selectionLocked) {
            return
        }
        setSelectionLocked(true)
        try {
            await gameHubService.chooseWord(roomCode, word)
        } catch (err) {
            console.error('Failed to choose word:', err)
            setSelectionLocked(false)
        }
    }

    const isActivePlayer =
        !!currentPlayer?.id && currentPlayer.id === activePlayer?.id

    const guessWord = useMemo(() => {
        if (isActivePlayer && currentWord) {
            return currentWord
        }
        if (currentWordHint) {
            const placeholders = Array.from(
                { length: currentWordHint.length },
                () => '_'
            )
            return placeholders.join('')
        }
        return currentWord || ''
    }, [currentWord, currentWordHint, isActivePlayer])

    const revealedIndices = useMemo(() => {
        if (isActivePlayer && currentWord) {
            return currentWord.split('').map((_, index) => index)
        }
        if (!currentWordHint?.revealedIndices) {
            return []
        }
        return currentWordHint.revealedIndices.map((hint) => hint.index)
    }, [currentWord, currentWordHint, isActivePlayer])

    return (
        <div className="flex flex-col gradient-bg">
            {overlay.type !== 'none' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 text-center">
                        {overlay.type === 'select' ? (
                            <>
                                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                                    Choose a word
                                </h2>
                                <p className="text-sm text-gray-500 mb-4">
                                    Pick one before the timer ends.
                                </p>
                                <div className="flex items-center justify-center mb-4">
                                    <Timer endTimeIso={selectionEndTime} />
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {overlay.options.map((option) => (
                                        <button
                                            key={option}
                                            onClick={() =>
                                                handleChooseWord(option)
                                            }
                                            disabled={selectionLocked}
                                            className={`w-full px-4 py-2 rounded-sm border text-sm font-medium ${
                                                selectionLocked
                                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                    : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                                            }`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                                    {overlay.activePlayerName} is choosing a
                                    word
                                </h2>
                                <p className="text-sm text-gray-500 mb-4">
                                    Get ready to guess.
                                </p>
                                <div className="flex items-center justify-center">
                                    <Timer endTimeIso={selectionEndTime} />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            <h1 className="text-3xl font-bold text-center mb-6 text-gray-700 self-center">
                Doodle Dash
            </h1>
            <div className="flex items-center justify-center gap-4 mb-4">
                <Timer endTimeIso={roundEndTime} />
                <GuessWord word={guessWord} revealedIndices={revealedIndices} />
            </div>
            <div className="h-screen flex pt-4 px-4 gap-4">
                <div className="flex-1 max-h-[70%]">
                    <Player />
                </div>
                <div className="flex flex-col h-[80vh] rounded-sm flex-3">
                    <Canvas
                        color={color}
                        brushSize={brushSize}
                        isDrawingAllowed={true}
                        throttleInMs={50}
                    />
                    <ColorPicker
                        activeColor={color}
                        setActiveColor={setColor}
                    />
                </div>
                <div className="flex-1 max-h-[70%]">
                    <Guess />
                </div>
            </div>
        </div>
    )
}
