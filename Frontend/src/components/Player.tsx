import { useGameStore } from '../store/gameStore'
import { PlayerAvatar } from './doodle'

export function Player() {
    const players = useGameStore((s) => s.players)
    const currentRound = useGameStore((s) => s.currentRound)
    const totalRounds = useGameStore((s) => s.totalRounds)
    const activePlayerId = useGameStore((s) => s.activePlayerId)
    const currentPlayer = useGameStore((s) => s.currentPlayer)

    const sorted = [...players].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    const maxScore = Math.max(1, ...sorted.map((p) => p.score ?? 0))

    return (
        <div className="dd-card" style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontFamily: 'var(--font-hand)', fontSize: 24 }}>Scoreboard</div>
                <span className="dd-chip">Round {currentRound}/{totalRounds}</span>
            </div>
            <hr className="dd-rule" style={{ margin: '6px 0 10px' }} />
            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gap: 8 }}>
                {sorted.map((p, i) => {
                    const isActive = p.id === activePlayerId
                    const isSelf = p.id === currentPlayer?.id
                    const pct = ((p.score ?? 0) / maxScore) * 100

                    return (
                        <div key={p.id} style={{
                            padding: 10, borderRadius: 14,
                            border: `2px solid ${isActive ? 'var(--crayon-coral)' : 'var(--ink)'}`,
                            background: isActive ? '#FFF5EE' : '#fff',
                            boxShadow: 'var(--sticker-sm)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ fontFamily: 'var(--font-hand)', fontSize: 20, width: 22, textAlign: 'center', color: i === 0 ? 'var(--crayon-sun)' : 'var(--ink-faint)' }}>
                                    {i === 0 ? '★' : i + 1}
                                </div>
                                <PlayerAvatar seed={p.name} size={34} ring={false} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {p.name}{isSelf && <span style={{ color: 'var(--ink-faint)', fontWeight: 600 }}> (you)</span>}
                                    </div>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: isActive ? 'var(--crayon-coral)' : 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        {isActive ? '✏️ Drawing' : 'Guessing'}
                                    </div>
                                </div>
                                <div style={{ fontFamily: 'var(--font-hand)', fontSize: 20 }}>{p.score ?? 0}</div>
                            </div>
                            <div style={{ marginTop: 5, height: 7, borderRadius: 4, background: 'var(--paper-warm)', border: '1.5px solid var(--ink)', overflow: 'hidden' }}>
                                <div style={{
                                    width: pct + '%', height: '100%',
                                    background: isActive ? 'var(--crayon-coral)' : 'var(--crayon-leaf)',
                                    transition: 'width 700ms var(--ease-pop)',
                                }} />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
