import { useEffect, useRef, useState } from 'react'
import { useLocalInputs } from '../store/inputStore'
import { useGameStore } from '../store/gameStore'
import { createRoom } from '../services/gameService'
import { gameHubService } from '../services/gameHubService'
import { BrandMark, DoodleBackdrop, PlayerAvatar } from '../components/doodle'
import { DDStepper, SketchUnderline, CenterTape, Tape } from '../design-system/dd'

export default function GameConfig() {
    const setMaxPlayers = useLocalInputs((s) => s.setMaxPlayers)
    const setTotalRounds = useLocalInputs((s) => s.setMaxRounds)
    const setDrawTime = useLocalInputs((s) => s.setDrawTime)
    const setCustomWords = useLocalInputs((s) => s.setCustomWords)
    const localInputs = useLocalInputs((s) => s.localInputs)
    const setCurrentScreen = useLocalInputs((s) => s.setCurrentScreen)

    const players = useGameStore((s) => s.players)
    const chatMessages = useGameStore((s) => s.chatMessages)
    const applyRoomSnapshot = useGameStore((s) => s.applyRoomSnapshot)
    const setGameStore = useGameStore((s) => s.setGameStore)
    const upsertPlayer = useGameStore((s) => s.upsertPlayer)
    const removePlayer = useGameStore((s) => s.removePlayer)
    const addChatMessage = useGameStore((s) => s.addChatMessage)
    const roomCode = useGameStore((s) => s.roomCode)
    const activePlayer = useGameStore((s) => s.currentPlayer)

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const hasJoinedRef = useRef(false)

    const isConfigLocked = !!roomCode
    const canStartGame = players.length >= 2 && !!roomCode

    async function handleCreateRoom() {
        setError(null)
        setIsLoading(true)
        const res = await createRoom({
            playerName: localInputs.playerName || 'Host',
            maxAllowedPlayers: localInputs.maxPlayers,
            totalRounds: localInputs.maxRounds,
            drawTimeSeconds: localInputs.drawTimeInSecond,
            customWords: localInputs.customWords,
        })
        if (res.isSuccess) {
            setGameStore({
                currentPlayer: { name: res.data.playerName || 'Host', id: res.data.playerId },
                roomCode: res.data.roomCode,
            })
        } else {
            setError(res.error.errorMessage)
        }
        setIsLoading(false)
    }

    async function handleStartGame() {
        if (!roomCode) return
        setIsLoading(true)
        setError(null)
        setGameStore({ pendingStartGame: true })
        setCurrentScreen('ROOM')
    }

    async function handleCopyInvite() {
        if (!roomCode) { setError('Create a room first.'); return }
        const url = `${window.location.origin}/${roomCode}`
        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch {
            setError('Failed to copy invite link.')
        }
    }

    useEffect(() => {
        const joinRoom = async () => {
            if (hasJoinedRef.current || !roomCode) return
            const name = activePlayer?.name ?? localInputs.playerName
            const id = activePlayer?.id
            const res = await gameHubService.joinRoom(roomCode, name || '', id)
            if (res.success) {
                hasJoinedRef.current = true
                setGameStore({ roomCode })
                applyRoomSnapshot(res)
            } else {
                setError(res.errorMessage || 'Failed to join room.')
            }
        }
        joinRoom()
    }, [applyRoomSnapshot, setGameStore, roomCode])

    useEffect(() => {
        const c1 = gameHubService.onPlayerJoined((p) => {
            if (!p) return
            upsertPlayer(p)
            addChatMessage({ playerId: 'system', playerName: 'System', message: `${p.name} joined`, messageType: 'System' })
        })
        const c2 = gameHubService.onPlayerLeft((p) => {
            if (!p) return
            removePlayer(p.id)
            addChatMessage({ playerId: 'system', playerName: 'System', message: `${p.name} left`, messageType: 'System' })
        })
        return () => { c1(); c2() }
    }, [addChatMessage, removePlayer, upsertPlayer])

    const systemMessages = chatMessages.filter((m) => m.messageType === 'System')
    const wordCount = localInputs.customWords.length
    const customWordsText = localInputs.customWords.join(', ')

    return (
        <div className="paper-bg" style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
            <DoodleBackdrop />
            <div style={{ position: 'relative', zIndex: 2, maxWidth: 1120, margin: '0 auto', padding: '32px 24px 60px' }}>

                {/* Top bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 26 }}>
                    <button type="button" className="dd-btn" style={{ padding: '8px 14px' }} onClick={() => setCurrentScreen('HOME')}>
                        ← Back
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <BrandMark size={40} />
                        <div style={{ fontFamily: 'var(--font-hand)', fontSize: 24 }}>DoodleDash</div>
                    </div>
                    <div style={{ width: 80 }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 28, alignItems: 'start' }}>
                    {/* Settings */}
                    <div className="dd-card tilt-l">
                        <CenterTape color="var(--crayon-sky)" />
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
                            <h2 className="dd-title" style={{ fontSize: 42 }}>Room settings</h2>
                            <span className="dd-chip" style={{ background: 'var(--crayon-sun)' }}>Host</span>
                        </div>
                        <SketchUnderline color="var(--crayon-coral)" width={200} />

                        <div style={{ display: 'grid', gap: 22, marginTop: 22 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
                                <div>
                                    <label className="dd-label"><span>Players</span><span style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 600, textTransform: 'none' }}>2–8</span></label>
                                    <DDStepper value={localInputs.maxPlayers} onChange={setMaxPlayers} min={2} max={8} disabled={isConfigLocked} />
                                </div>
                                <div>
                                    <label className="dd-label"><span>Rounds</span><span style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 600, textTransform: 'none' }}>1–10</span></label>
                                    <DDStepper value={localInputs.maxRounds} onChange={setTotalRounds} min={1} max={10} disabled={isConfigLocked} />
                                </div>
                            </div>

                            <div>
                                <label className="dd-label">
                                    <span>Draw time</span>
                                    <span style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 600, textTransform: 'none' }}>{localInputs.drawTimeInSecond}s per turn</span>
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <input type="range" min="10" max="180" step="10"
                                        value={localInputs.drawTimeInSecond}
                                        onChange={(e) => setDrawTime(parseInt(e.target.value))}
                                        disabled={isConfigLocked}
                                        style={{ flex: 1, accentColor: 'var(--crayon-coral)', cursor: isConfigLocked ? 'not-allowed' : 'pointer' }}
                                    />
                                    <div style={{
                                        fontFamily: 'var(--font-hand)', fontSize: 26, minWidth: 64, textAlign: 'center',
                                        border: '2.5px solid var(--ink)', borderRadius: 12, padding: '6px 10px',
                                        background: isConfigLocked ? 'var(--paper-warm)' : '#fff',
                                        boxShadow: 'var(--sticker-sm)',
                                    }}>{localInputs.drawTimeInSecond}s</div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-faint)', fontWeight: 700, marginTop: 4 }}>
                                    <span>SPEEDY</span><span>CASUAL</span><span>EPIC</span>
                                </div>
                            </div>

                            <div>
                                <label className="dd-label">
                                    <span>Custom words {' '}
                                        <span style={{ fontWeight: 500, textTransform: 'none', color: 'var(--ink-faint)' }}>(optional)</span>
                                    </span>
                                    {wordCount > 0 && <span style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 600, textTransform: 'none' }}>{wordCount} word{wordCount === 1 ? '' : 's'}</span>}
                                </label>
                                <textarea
                                    className="dd-input"
                                    value={customWordsText}
                                    onChange={(e) => setCustomWords(e.target.value)}
                                    placeholder="banana, skateboard, eiffel tower, waffle…"
                                    disabled={isConfigLocked}
                                    style={{ minHeight: 100, resize: 'vertical', fontSize: 15 }}
                                />
                            </div>

                            <div style={{ display: 'grid', gap: 10 }}>
                                {roomCode ? (
                                    <>
                                        <button type="button"
                                            className="dd-btn dd-btn--primary dd-btn--xl w-full"
                                            disabled={!canStartGame || isLoading}
                                            onClick={() => void handleStartGame()}
                                        >
                                            {isLoading ? 'Starting…' : canStartGame ? '▶  Start game' : 'Need at least 2 players'}
                                        </button>
                                        {!canStartGame && (
                                            <p style={{ fontSize: 12, color: 'var(--ink-faint)', textAlign: 'center', fontWeight: 600, margin: 0 }}>
                                                Share the code to invite friends.
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <button type="button"
                                        className="dd-btn dd-btn--primary dd-btn--xl w-full"
                                        disabled={isLoading}
                                        onClick={() => void handleCreateRoom()}
                                    >
                                        {isLoading ? 'Creating…' : '🎨  Create room'}
                                    </button>
                                )}
                                {error && <p style={{ color: 'var(--crayon-coral)', fontWeight: 700, fontSize: 14, margin: 0, textAlign: 'center' }}>{error}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Lobby column */}
                    <div style={{ display: 'grid', gap: 20 }}>
                        {/* Invite card */}
                        <div className="dd-card tilt-r" style={{ padding: 20 }}>
                            <Tape color="var(--crayon-coral)" top={-10} left={22} rotate={-6} />
                            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: 'var(--ink-soft)', textTransform: 'uppercase', marginBottom: 6 }}>Invite friends</div>
                            {roomCode ? (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            flex: 1, fontFamily: 'var(--font-hand)', fontSize: 32, letterSpacing: 6,
                                            padding: '10px 16px', background: 'var(--paper-warm)',
                                            border: '2.5px dashed var(--ink)', borderRadius: 14, textAlign: 'center',
                                        }}>{roomCode}</div>
                                        <button type="button" className="dd-btn dd-btn--sky" onClick={() => void handleCopyInvite()}>
                                            {copied ? '✓ Copied' : '📋 Copy'}
                                        </button>
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 8, fontWeight: 600 }}>
                                        {window.location.origin}/<span style={{ color: 'var(--ink)' }}>{roomCode}</span>
                                    </div>
                                </>
                            ) : (
                                <div style={{ color: 'var(--ink-faint)', fontStyle: 'italic', fontSize: 14, fontWeight: 600 }}>
                                    Create a room to get your invite code.
                                </div>
                            )}
                        </div>

                        {/* Players card */}
                        <div className="dd-card" style={{ padding: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                <div style={{ fontFamily: 'var(--font-hand)', fontSize: 26 }}>Lobby</div>
                                <span className="dd-chip">
                                    <span style={{ color: players.length > 0 ? 'var(--crayon-leaf)' : 'var(--ink-ghost)' }}>●</span>
                                    {players.length}/{localInputs.maxPlayers}
                                </span>
                            </div>
                            <div style={{ display: 'grid', gap: 10 }}>
                                {players.map((p, i) => (
                                    <div key={p.id} className="pop-in" style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        padding: '8px 12px',
                                        border: '2px solid var(--ink)', borderRadius: 14,
                                        background: i === 0 ? 'var(--paper-warm)' : '#fff',
                                        boxShadow: 'var(--sticker-sm)',
                                        animationDelay: `${i * 80}ms`,
                                    }}>
                                        <PlayerAvatar seed={p.name} size={42} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 800, fontSize: 15 }}>{p.name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                                                {i === 0 ? '★ Host' : 'In lobby'}
                                            </div>
                                        </div>
                                        {i === 0 && <span className="dd-chip" style={{ background: 'var(--crayon-sun)' }}>You</span>}
                                    </div>
                                ))}
                                {Array.from({ length: Math.max(0, localInputs.maxPlayers - players.length) }).map((_, i) => (
                                    <div key={'empty-' + i} style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        padding: '8px 12px', border: '2px dashed var(--ink-ghost)',
                                        borderRadius: 14, color: 'var(--ink-faint)', fontStyle: 'italic', fontWeight: 600,
                                    }}>
                                        <div style={{ width: 42, height: 42, borderRadius: '50%', border: '2px dashed var(--ink-ghost)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-ghost)' }}>?</div>
                                        Waiting for a friend…
                                    </div>
                                ))}
                            </div>

                            {/* Activity feed */}
                            {systemMessages.length > 0 && (
                                <>
                                    <hr className="dd-rule" />
                                    <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.5, color: 'var(--ink-soft)', textTransform: 'uppercase', marginBottom: 8 }}>Activity</div>
                                    <div style={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        {systemMessages.map((m, i) => (
                                            <div key={`${m.playerId}-${i}`} style={{
                                                fontSize: 13, color: 'var(--ink-soft)', fontStyle: 'italic',
                                                padding: '4px 8px', background: 'var(--paper-warm)', borderRadius: 8,
                                            }}>{m.message}</div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
