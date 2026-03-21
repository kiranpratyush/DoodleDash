import { useMemo } from 'react'
import { useGameStore } from '../store/gameStore'

export function RoundOver() {
    const lastRoundResult = useGameStore((state) => state.lastRoundResult)
    const players = useMemo(() => {
        if (!lastRoundResult) {
            return []
        }
        return [...lastRoundResult.players].sort(
            (a, b) => (b.score ?? 0) - (a.score ?? 0)
        )
    }, [lastRoundResult])

    if (!lastRoundResult) return null

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-[2px] px-4">
            <div className="w-full max-w-xl rounded-3xl border border-white/50 bg-white/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-700">
                    Round Complete
                </p>
                <h2 className="mt-2 text-3xl font-black text-slate-900">
                    Round {lastRoundResult.roundNumber}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                    Correct word:{' '}
                    <span className="font-bold text-slate-900">
                        {lastRoundResult.correctWord}
                    </span>
                </p>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-white">
                    <div className="grid grid-cols-12 border-b border-slate-200 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                        <span className="col-span-2">Rank</span>
                        <span className="col-span-7">Player</span>
                        <span className="col-span-3 text-right">Score</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {players.map((player, index) => {
                            return (
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
                            )
                        })}
                    </div>
                </div>

                <p className="mt-4 text-sm text-slate-600">
                    Preparing next round...
                </p>
            </div>
        </div>
    )
}
