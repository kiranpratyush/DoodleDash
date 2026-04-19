import { useMemo, useState } from 'react'
import { gameHubService } from '../services/gameHubService'
import { useGameStore } from '../store/gameStore'
import { useLocalInputs } from '../store/inputStore'
import { PlayerAvatar } from './doodle'
import { SketchUnderline } from '../design-system/dd'

function Confetti() {
    const items = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 1.5,
        dur: 2.4 + Math.random() * 2,
        color: ['#EF6C4A','#F5B841','#6DAA5A','#4A9DD9','#9A6FB0','#D94A77'][i % 6],
        rot: Math.random() * 360,
        w: 6 + Math.random() * 8,
        h: 10 + Math.random() * 12,
    })), [])
    return (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 5 }}>
            {items.map((it, i) => (
                <div key={i} style={{
                    position: 'absolute', top: -20, left: it.left + '%',
                    width: it.w, height: it.h,
                    background: it.color, border: '1.5px solid #2B2A27',
                    transform: `rotate(${it.rot}deg)`,
                    animation: `confetti-fall ${it.dur}s linear ${it.delay}s infinite`,
                }} />
            ))}
        </div>
    )
}

export function GameOver() {
    const finalResult = useGameStore((s) => s.finalResult)
    const roomCode = useGameStore((s) => s.roomCode)
    const currentPlayer = useGameStore((s) => s.currentPlayer)
    const hostId = useGameStore((s) => s.hostId)
    const setCurrentScreen = useLocalInputs((s) => s.setCurrentScreen)
    const [isReplaying, setIsReplaying] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const sortedScores = useMemo(() => {
        if (!finalResult?.finalScores) return []
        return [...finalResult.finalScores].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    }, [finalResult?.finalScores])

    if (!finalResult) return null

    const isHost = !!currentPlayer?.id && currentPlayer.id === hostId
    const [winner, second, third] = sortedScores

    async function onPlayAgain() {
        if (!isHost || !roomCode || isReplaying) return
        setError(null)
        setIsReplaying(true)
        try {
            await gameHubService.replayGame(roomCode)
        } catch {
            setError('Could not start replay. Please try again.')
        } finally {
            setIsReplaying(false)
        }
    }

    const PODIUM_ORDER = [second, winner, third]
    const RANKS = [2, 1, 3]
    const HEIGHTS: Record<number, number> = { 1: 160, 2: 110, 3: 80 }
    const COLORS: Record<number, string> = { 1: 'var(--crayon-sun)', 2: 'var(--crayon-sky)', 3: 'var(--crayon-grape)' }
    const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

    return (
        <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(43,42,39,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10, padding: 24, overflow: 'hidden',
        }}>
            <Confetti />
            <div style={{ position: 'relative', zIndex: 6, maxWidth: 680, width: '100%' }}>
                {/* Winner header */}
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.6, color: '#fff', textTransform: 'uppercase', textShadow: '0 1px 0 rgba(0,0,0,0.4)' }}>Game over</div>
                    <h1 className="dd-title pop-in" style={{ fontSize: 60, color: '#fff', textShadow: '2px 2px 0 var(--ink)' }}>
                        {winner?.name} <span style={{ color: 'var(--crayon-sun)' }}>wins!</span>
                    </h1>
                    <SketchUnderline color="var(--crayon-sun)" width={280} style={{ margin: '4px auto 0' }} />
                </div>

                {/* Podium */}
                {sortedScores.length >= 2 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 16, alignItems: 'end', marginBottom: 20 }}>
                        {PODIUM_ORDER.map((p, i) => {
                            if (!p) return <div key={i} />
                            const rank = RANKS[i]
                            return (
                                <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div className={rank === 1 ? 'wobble' : ''} style={{ marginBottom: 8 }}>
                                        <PlayerAvatar seed={p.name} size={rank === 1 ? 88 : 64} />
                                    </div>
                                    <div style={{ fontFamily: 'var(--font-hand)', fontSize: rank === 1 ? 28 : 20, color: '#fff', textShadow: '1px 1px 0 var(--ink)' }}>{p.name}</div>
                                    <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.8)' }}>{p.score ?? 0} pts</div>
                                    <div className="pop-in" style={{
                                        marginTop: 10, width: '100%', height: HEIGHTS[rank],
                                        background: COLORS[rank], border: '2.5px solid var(--ink)',
                                        borderRadius: 14, boxShadow: 'var(--sticker)',
                                        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                                        paddingTop: 12, fontSize: rank === 1 ? 48 : 36,
                                        animationDelay: `${i * 120}ms`,
                                    }}>
                                        {MEDALS[rank]}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Scores table */}
                <div className="dd-card" style={{ padding: 20, marginBottom: 16 }}>
                    <div style={{ fontFamily: 'var(--font-hand)', fontSize: 22, marginBottom: 8 }}>Final scores</div>
                    <div style={{ maxHeight: 200, overflowY: 'auto', display: 'grid', gap: 6 }}>
                        {sortedScores.map((p, i) => (
                            <div key={p.id} style={{
                                display: 'grid', gridTemplateColumns: '28px 1fr auto',
                                alignItems: 'center', gap: 10,
                                padding: '6px 10px', borderRadius: 10,
                                background: i === 0 ? 'var(--paper-warm)' : 'var(--paper)',
                                border: '1.5px solid var(--ink-ghost)',
                            }}>
                                <span style={{ fontFamily: 'var(--font-hand)', fontSize: 18, color: i === 0 ? 'var(--crayon-sun)' : 'var(--ink-faint)' }}>
                                    {i === 0 ? '★' : i + 1}
                                </span>
                                <span style={{ fontWeight: 800 }}>{p.name}</span>
                                <span style={{ fontFamily: 'var(--font-hand)', fontSize: 20 }}>{p.score ?? 0}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {isHost ? (
                        <button type="button" className="dd-btn dd-btn--primary dd-btn--lg"
                            disabled={isReplaying}
                            onClick={() => void onPlayAgain()}>
                            {isReplaying ? 'Starting…' : '↻ Play again'}
                        </button>
                    ) : (
                        <div style={{ fontSize: 14, color: '#fff', fontWeight: 700, textShadow: '0 1px 0 rgba(0,0,0,0.4)' }}>
                            Waiting for host to start the next game…
                        </div>
                    )}
                    <button type="button" className="dd-btn dd-btn--lg"
                        onClick={() => setCurrentScreen('GAMECONFIG')}>
                        🏠 Back home
                    </button>
                </div>
                {error && <p style={{ color: 'var(--crayon-coral)', fontWeight: 700, textAlign: 'center', marginTop: 10, background: '#fff', padding: '6px 12px', borderRadius: 8 }}>{error}</p>}
            </div>
        </div>
    )
}
