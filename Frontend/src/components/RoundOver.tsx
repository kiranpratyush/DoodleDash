import { useMemo } from 'react'
import { useGameStore } from '../store/gameStore'
import { PlayerAvatar } from './doodle'
import { CenterTape, SketchUnderline } from '../design-system/dd'

export function RoundOver() {
    const lastRoundResult = useGameStore((s) => s.lastRoundResult)
    const sorted = useMemo(() => {
        if (!lastRoundResult) return []
        return [...lastRoundResult.players].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    }, [lastRoundResult])

    if (!lastRoundResult) return null

    const maxScore = Math.max(1, ...sorted.map((p) => p.score ?? 0))

    return (
        <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(43,42,39,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10, padding: 24,
        }}>
            <div className="dd-card tilt-l pop-in" style={{ padding: 32, maxWidth: 560, width: '100%' }}>
                <CenterTape color="var(--crayon-sky)" />
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.4, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>
                        Round {lastRoundResult.roundNumber}
                    </div>
                    <h2 className="dd-title" style={{ fontSize: 48, marginTop: 2 }}>Round over!</h2>
                    <SketchUnderline color="var(--crayon-coral)" width={220} style={{ margin: '8px auto 0' }} />
                    <div style={{
                        marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 10,
                        padding: '10px 18px', background: 'var(--paper-warm)',
                        border: '2.5px dashed var(--ink)', borderRadius: 18,
                    }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 1 }}>The word was</span>
                        <span style={{ fontFamily: 'var(--font-hand)', fontSize: 32, color: 'var(--crayon-coral)' }}>{lastRoundResult.correctWord}</span>
                    </div>
                </div>

                <hr className="dd-rule" style={{ marginTop: 22 }} />

                <div style={{ display: 'grid', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                    {sorted.map((p, i) => {
                        const pct = ((p.score ?? 0) / maxScore) * 100
                        return (
                            <div key={p.id} style={{
                                display: 'grid', gridTemplateColumns: '24px 40px 1fr 72px',
                                alignItems: 'center', gap: 10,
                                padding: '8px 12px', border: '2px solid var(--ink)',
                                borderRadius: 14, background: '#fff', boxShadow: 'var(--sticker-sm)',
                            }}>
                                <div style={{ fontFamily: 'var(--font-hand)', fontSize: 22, textAlign: 'center', color: i === 0 ? 'var(--crayon-sun)' : 'var(--ink-faint)' }}>
                                    {i === 0 ? '★' : i + 1}
                                </div>
                                <PlayerAvatar seed={p.name} size={38} ring={false} />
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: 14 }}>{p.name}</div>
                                    <div style={{ height: 8, marginTop: 4, border: '1.5px solid var(--ink)', borderRadius: 5, background: 'var(--paper-warm)', overflow: 'hidden' }}>
                                        <div style={{
                                            width: pct + '%', height: '100%',
                                            background: i === 0 ? 'var(--crayon-sun)' : 'var(--crayon-leaf)',
                                            animation: 'dd-bar-grow 800ms var(--ease-pop) both',
                                            animationDelay: `${i * 80}ms`,
                                        }} />
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontFamily: 'var(--font-hand)', fontSize: 22 }}>{p.score ?? 0}</div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div style={{ textAlign: 'center', marginTop: 20, color: 'var(--ink-faint)', fontSize: 13, fontWeight: 700 }}>
                    Preparing next round…
                </div>
            </div>
        </div>
    )
}
