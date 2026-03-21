import { useState } from 'react'
import { Timer } from './Timer'
import { gameHubService } from '../services/gameHubService'
import { useGameStore } from '../store/gameStore'

interface Prop {
    time: number
    wordOptions: string[]
}
interface Prop2 {
    time: number
    playerName: string
}

export function WordPicker({ time, wordOptions }: Prop) {
    const room = useGameStore((state) => state.roomCode)
    const [selectedWord, setSelectedWord] = useState<string | null>(null)

    async function onSelectWord(word: string) {
        if (selectedWord) {
            return
        }

        setSelectedWord(word)
        await gameHubService.chooseWord(room, word)
    }

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/35 backdrop-blur-[2px] px-4">
            <div className="w-full max-w-xl rounded-3xl border border-white/50 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-700">
                            Your Turn
                        </p>
                        <h2 className="mt-2 text-3xl font-black text-slate-900">
                            Choose a word
                        </h2>
                        <p className="mt-2 text-sm text-slate-600">
                            Pick the prompt you want to draw before the timer
                            runs out.
                        </p>
                    </div>
                    <div className="shrink-0 rounded-full bg-white/80 p-2 shadow-sm">
                        <Timer timeCount={time} />
                    </div>
                </div>

                <div className="grid gap-3">
                    {wordOptions.map((word, index) => {
                        const isSelected = selectedWord === word

                        return (
                            <button
                                key={index}
                                type="button"
                                disabled={selectedWord !== null}
                                onClick={async () => await onSelectWord(word)}
                                className={`group w-full rounded-2xl border px-5 py-4 text-left transition duration-200 ${
                                    isSelected
                                        ? 'border-cyan-700 bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                                        : 'border-slate-200 bg-white text-slate-900 hover:-translate-y-0.5 hover:border-cyan-400 hover:bg-cyan-50 hover:shadow-md'
                                } ${selectedWord && !isSelected ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                            >
                                <span className="flex items-center justify-between gap-4">
                                    <span className="text-lg font-semibold capitalize tracking-wide">
                                        {word}
                                    </span>
                                    <span
                                        className={`text-xs font-bold uppercase tracking-[0.3em] ${
                                            isSelected
                                                ? 'text-cyan-50'
                                                : 'text-slate-400 transition group-hover:text-cyan-600'
                                        }`}
                                    ></span>
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export function WaitingForWordToBeChoosen({ time, playerName }: Prop2) {
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/30 backdrop-blur-[2px] px-4">
            <div className="w-full max-w-md rounded-3xl border border-white/50 bg-white/90 p-6 text-center shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
                <div className="mx-auto mb-4 flex w-fit rounded-full bg-white/80 p-2 shadow-sm">
                    <Timer timeCount={time} />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-700">
                    Get Ready
                </p>
                <h2 className="mt-3 text-2xl font-black text-slate-900">
                    {playerName} is choosing a word
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                    The round will begin as soon as the prompt is locked in.
                </p>
            </div>
        </div>
    )
}
