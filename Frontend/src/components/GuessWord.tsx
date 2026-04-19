import { useGameStore } from '../store/gameStore'

export function GuessWord() {
    const currentWord = useGameStore((s) => s.currentWord)
    const wordHint = useGameStore((s) => s.currentWordHint)
    const activePlayerId = useGameStore((s) => s.activePlayerId)
    const currentPlayer = useGameStore((s) => s.currentPlayer)

    const isDrawer = !!activePlayerId && currentPlayer?.id === activePlayerId

    if (isDrawer && currentWord) {
        // Drawer sees their own word clearly
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-faint)', letterSpacing: 1, textTransform: 'uppercase' }}>
                    Your word
                </div>
                <div style={{
                    fontFamily: 'var(--font-hand)', fontSize: 28, color: 'var(--crayon-coral)',
                    padding: '6px 16px', background: 'var(--paper-warm)',
                    border: '2.5px dashed var(--ink)', borderRadius: 14,
                    boxShadow: 'var(--sticker-sm)',
                }}>
                    {currentWord}
                </div>
            </div>
        )
    }

    if (!wordHint) return null

    const chars = Array.from({ length: wordHint.length }, (_, i) => {
        const revealed = wordHint.revealedIndices?.find((r) => r.index === i)
        return revealed ? revealed.character : null
    })

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-faint)', letterSpacing: 1, textTransform: 'uppercase' }}>
                Guess the word
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', justifyContent: 'center' }}>
                {chars.map((c, i) => (
                    <div key={i} style={{
                        width: 26, height: 34,
                        border: '2.5px solid var(--ink)', borderRadius: 8,
                        background: c ? 'var(--paper-warm)' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-hand)', fontSize: 20,
                        boxShadow: 'var(--sticker-sm)',
                        animation: c ? 'dd-flip 420ms var(--ease) both' : 'none',
                    }}>
                        {c ? c.toUpperCase() : <span style={{ color: 'var(--ink-ghost)' }}>_</span>}
                    </div>
                ))}
                <span className="dd-chip" style={{ marginLeft: 6 }}>
                    {wordHint.length} letters
                </span>
            </div>
        </div>
    )
}
