import { useEffect, useState } from 'react'
import { gameHubService } from '../services/gameHubService'
import { useGameStore } from '../store/gameStore'
import { PlayerAvatar } from './doodle'
import { CenterTape, SketchUnderline } from '../design-system/dd'

function RoundSplash({ roundNumber }: { roundNumber: number }) {
    return (
        <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(43,42,39,0.6)',
            zIndex: 20, animation: 'dd-pop-in 280ms var(--ease)',
        }}>
            <div className="dd-card pop-in" style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.4, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>Get ready</div>
                <h2 className="dd-title" style={{ fontSize: 64, color: 'var(--crayon-coral)', marginTop: 4 }}>Round {roundNumber}</h2>
            </div>
        </div>
    )
}

function OverlayShell({ children }: { children: React.ReactNode }) {
    return (
        <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(43,42,39,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10, animation: 'dd-pop-in 280ms var(--ease)',
        }}>
            {children}
        </div>
    )
}

interface WordPickerProps {
    time: number
    wordOptions: string[]
}

export function WordPicker({ time, wordOptions }: WordPickerProps) {
    const room = useGameStore((s) => s.roomCode)
    const currentRound = useGameStore((s) => s.currentRound)
    const [selectedWord, setSelectedWord] = useState<string | null>(null)
    const [showSplash, setShowSplash] = useState(true)

    useEffect(() => {
        const t = setTimeout(() => setShowSplash(false), 2000)
        return () => clearTimeout(t)
    }, [])

    if (showSplash) return <RoundSplash roundNumber={currentRound} />

    async function onSelectWord(word: string) {
        if (selectedWord) return
        setSelectedWord(word)
        await gameHubService.chooseWord(room, word)
    }

    const CARD_BG = ['#FFF5EE', '#FFF9E6', '#EEFBF0']

    return (
        <OverlayShell>
            <div className="dd-card tilt-l" style={{ padding: 36, maxWidth: 600, textAlign: 'center', width: '90%' }}>
                <CenterTape color="var(--crayon-sun)" />
                <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.2, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>Your turn to draw</div>
                <h2 className="dd-title" style={{ fontSize: 44, marginTop: 4 }}>Pick a word</h2>
                <SketchUnderline color="var(--crayon-coral)" width={200} style={{ margin: '8px auto 0' }} />
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 26, flexWrap: 'wrap' }}>
                    {wordOptions.map((w, i) => (
                        <button key={w} type="button"
                            className="dd-btn dd-btn--lg pop-in"
                            onClick={() => void onSelectWord(w)}
                            disabled={selectedWord !== null}
                            style={{
                                background: selectedWord === w ? 'var(--crayon-coral)' : CARD_BG[i % 3],
                                color: selectedWord === w ? '#fff' : 'var(--ink)',
                                fontFamily: 'var(--font-hand)', fontSize: 26, minWidth: 150,
                                animationDelay: `${i * 80}ms`,
                                opacity: selectedWord && selectedWord !== w ? 0.5 : 1,
                            }}>
                            {w}
                        </button>
                    ))}
                </div>
                <div style={{ marginTop: 20, color: 'var(--ink-faint)', fontSize: 13, fontWeight: 700 }}>
                    Auto-picking in {time}s…
                </div>
            </div>
        </OverlayShell>
    )
}

interface WaitingProps {
    time?: number
    playerName: string
}

export function WaitingForWordToBeChoosen({ playerName }: WaitingProps) {
    const currentRound = useGameStore((s) => s.currentRound)
    const [showSplash, setShowSplash] = useState(true)

    useEffect(() => {
        const t = setTimeout(() => setShowSplash(false), 2000)
        return () => clearTimeout(t)
    }, [])

    if (showSplash) return <RoundSplash roundNumber={currentRound} />

    return (
        <OverlayShell>
            <div className="dd-card" style={{ padding: 36, maxWidth: 480, textAlign: 'center', width: '90%' }}>
                <div className="wobble" style={{ display: 'inline-block' }}>
                    <PlayerAvatar seed={playerName} size={88} />
                </div>
                <h2 className="dd-title" style={{ fontSize: 36, marginTop: 12 }}><b>{playerName}</b></h2>
                <div style={{ color: 'var(--ink-soft)', marginTop: 4, fontWeight: 700 }}>is choosing a word…</div>
                <div style={{ marginTop: 18, display: 'inline-flex', gap: 6 }}>
                    {[0, 1, 2].map((i) => (
                        <div key={i} style={{
                            width: 10, height: 10, borderRadius: '50%', background: 'var(--crayon-coral)',
                            animation: `dd-float 1.2s ease-in-out ${i * 0.15}s infinite`,
                        }} />
                    ))}
                </div>
            </div>
        </OverlayShell>
    )
}
