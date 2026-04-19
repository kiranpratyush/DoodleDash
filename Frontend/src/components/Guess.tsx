import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { gameHubService } from '../services/gameHubService'
import type { ChatMessage } from '../types'

function ChatBubble({ m }: { m: ChatMessage }) {
    if (m.messageType === 'System') {
        const isCorrect = m.message.toLowerCase().includes('guessed') || m.message.toLowerCase().includes('correct')
        if (isCorrect) {
            return (
                <div className="pop-in" style={{
                    background: 'var(--crayon-leaf)', color: '#fff',
                    border: '2.5px solid var(--ink)', borderRadius: 14,
                    padding: '8px 12px', fontWeight: 800, boxShadow: 'var(--sticker-sm)',
                    display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    <span style={{ fontSize: 16 }}>🎉</span>
                    <span>{m.message}</span>
                </div>
            )
        }
        return (
            <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontStyle: 'italic', textAlign: 'center', padding: '2px 0' }}>
                {m.message}
            </div>
        )
    }
    return (
        <div style={{ fontSize: 14, padding: '3px 0' }}>
            <b style={{ color: 'var(--ink)' }}>{m.playerName}:</b>{' '}
            <span style={{ color: 'var(--ink-soft)' }}>{m.message}</span>
        </div>
    )
}

export function Guess() {
    const [guess, setGuess] = useState('')
    const chatMessages = useGameStore((s) => s.chatMessages)
    const roomCode = useGameStore((s) => s.roomCode)
    const activePlayerId = useGameStore((s) => s.activePlayerId)
    const currentPlayer = useGameStore((s) => s.currentPlayer)
    const listRef = useRef<HTMLDivElement>(null)

    const isDrawer = !!activePlayerId && currentPlayer?.id === activePlayerId

    useEffect(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
    }, [chatMessages.length])

    async function handleSend() {
        const text = guess.trim()
        if (!text || !roomCode || isDrawer) return
        try {
            await gameHubService.guessWord(roomCode, text)
            setGuess('')
        } catch (err) {
            console.error('Failed to send guess', err)
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') void handleSend()
    }

    return (
        <div className="dd-card" style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontFamily: 'var(--font-hand)', fontSize: 24 }}>Guess chat</div>
                <span className="dd-chip">💬 {chatMessages.length}</span>
            </div>
            <hr className="dd-rule" style={{ margin: '6px 0 10px' }} />
            <div ref={listRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5, paddingRight: 2 }}>
                {chatMessages.map((m, i) => <ChatBubble key={`${m.playerId}-${i}`} m={m} />)}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); void handleSend() }} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <input
                    className="dd-input"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isDrawer ? "You're drawing — no guessing!" : 'Type your guess…'}
                    disabled={isDrawer}
                    style={{ fontSize: 14, padding: '10px 12px' }}
                />
                <button type="submit" className="dd-btn dd-btn--primary"
                    disabled={isDrawer || !guess.trim()}
                    style={{ padding: '10px 14px', flexShrink: 0 }}>
                    Send
                </button>
            </form>
        </div>
    )
}
