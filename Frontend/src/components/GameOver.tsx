import { useMemo, useState } from 'react'
import { gameHubService } from '../services/gameHubService'
import { useGameStore } from '../store/gameStore'
import { useLocalInputs } from '../store/inputStore'

export function GameOver() {
    const finalResult = useGameStore((state) => state.finalResult)
    const roomCode = useGameStore((state) => state.roomCode)
    const currentPlayer = useGameStore((state) => state.currentPlayer)
    const hostId = useGameStore((state) => state.hostId)
    const setCurrentScreen = useLocalInputs((state) => state.setCurrentScreen)
    const [isReplaying, setIsReplaying] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const sortedScores = useMemo(() => {
        if (!finalResult?.finalScores) {
            return []
        }
        return [...finalResult.finalScores].sort(
            (a, b) => (b.score ?? 0) - (a.score ?? 0)
        )
    }, [finalResult?.finalScores])

    if (!finalResult) {
        return null
    }

    const winner = finalResult.winner ?? sortedScores[0]
    const isHost = !!currentPlayer?.id && currentPlayer.id === hostId

    async function onPlayAgain() {
        if (!isHost || !roomCode || isReplaying) {
            return
        }

        setError(null)
        setIsReplaying(true)
        try {
            await gameHubService.replayGame(roomCode)
        } catch (err) {
            console.error('Replay failed', err)
            setError('Could not start replay. Please try again.')
        } finally {
            setIsReplaying(false)
        }
    }

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45 backdrop-blur-[2px] px-4">
            <div className="w-full max-w-2xl rounded-3xl border border-white/40 bg-white/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-700">
                    Session Complete
                </p>
                <h2 className="mt-2 text-3xl font-black text-slate-900">
                    Game Over
                </h2>

                {winner && (
                    <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-slate-900">
                        <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-700">
                            Winner
                        </p>
                        <p className="mt-1 text-2xl font-black">
                            {winner.name}
                            <span className="ml-2 text-lg font-semibold text-amber-700">
                                {winner.score ?? 0} pts
                            </span>
                        </p>
                    </div>
                )}

                <div className="mt-5 rounded-2xl border border-slate-200 bg-white">
                    <div className="grid grid-cols-12 border-b border-slate-200 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                        <span className="col-span-2">Rank</span>
                        <span className="col-span-7">Player</span>
                        <span className="col-span-3 text-right">Score</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {sortedScores.map((player, index) => (
                            <div
                                key={player.id}
                                className="grid grid-cols-12 px-4 py-3 text-sm text-slate-800 odd:bg-slate-50"
                            >
                                <span className="col-span-2 font-bold">
                                    #{index + 1}
                                </span>
                                <span className="col-span-7 font-semibold">
                                    {player.name}
                                </span>
                                <span className="col-span-3 text-right font-bold">
                                    {player.score ?? 0}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => setCurrentScreen('GAMECONFIG')}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                        Back To Game Config
                    </button>

                    {isHost ? (
                        <button
                            type="button"
                            onClick={() => void onPlayAgain()}
                            disabled={isReplaying}
                            className="rounded-xl border border-cyan-700 bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isReplaying ? 'Starting...' : 'Play Again'}
                        </button>
                    ) : (
                        <p className="text-sm text-slate-600">
                            Waiting for host to start the next game.
                        </p>
                    )}
                </div>
                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </div>
        </div>
    )
}
