import { useState } from 'react'
import { useLocalInputs } from '../store/inputStore'
import { useGameStore } from '../store/gameStore'
import { gameHubService } from '../services/gameHubService'
import {
    BrandMark,
    DoodleBackdrop,
    FloatingDoodles,
    PlayerAvatar,
} from '../components/doodle'
import { SketchUnderline } from '../design-system/dd'

const PREVIEW_NAMES = ['Mila', 'Kiran', 'Jules', 'Tom', 'Nina', 'Rue']

export default function Home() {
    const playerName = useLocalInputs((s) => s.localInputs.playerName)
    const setPlayerName = useLocalInputs((s) => s.setPlayerName)
    const setCurrentScreen = useLocalInputs((s) => s.setCurrentScreen)
    const setGameStore = useGameStore((s) => s.setGameStore)
    const applyRoomSnapshot = useGameStore((s) => s.applyRoomSnapshot)

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [mode, setMode] = useState<'create' | 'join'>('create')
    const [joinCode, setJoinCode] = useState('')

    const roomCodeFromUrl = window.location.pathname.slice(1) || null
    const isJoinMode = mode === 'join' || !!roomCodeFromUrl
    const canGo =
        (playerName?.length ?? 0) >= 2 &&
        (!isJoinMode || joinCode.trim().length >= 3 || !!roomCodeFromUrl)

    async function handleGo() {
        if (!canGo) return
        const code = roomCodeFromUrl || joinCode.trim().toUpperCase()
        if (isJoinMode && code) {
            setIsLoading(true)
            setError(null)
            const res = await gameHubService.joinRoom(code, playerName!)
            if (res.success) {
                setGameStore({ roomCode: code })
                applyRoomSnapshot(res)
                setCurrentScreen('ROOM')
            } else {
                setError(res.errorMessage || 'Failed to join room.')
            }
            setIsLoading(false)
        } else {
            setCurrentScreen('GAMECONFIG')
        }
    }

    return (
        <div
            className="paper-bg"
            style={{
                position: 'relative',
                minHeight: '100vh',
                overflow: 'hidden',
            }}
        >
            <DoodleBackdrop />
            <FloatingDoodles />
            <div
                style={{
                    position: 'relative',
                    zIndex: 2,
                    maxWidth: 960,
                    margin: '0 auto',
                    padding: '48px 24px 80px',
                    height: '100vh',
                }}
            >
                {/* Header */}
                <header
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 36,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                        }}
                    >
                        <div
                            className="wobble"
                            style={{ transformOrigin: 'center' }}
                        >
                            <BrandMark size={52} />
                        </div>
                        <div>
                            <div
                                style={{
                                    fontFamily: 'var(--font-hand)',
                                    fontSize: 30,
                                    lineHeight: 1,
                                }}
                            >
                                DoodleDash
                            </div>
                            <div
                                style={{
                                    fontSize: 12,
                                    color: 'var(--ink-soft)',
                                    fontWeight: 700,
                                    letterSpacing: 0.6,
                                    textTransform: 'uppercase',
                                }}
                            >
                                Draw · Guess · Giggle
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <span className="dd-chip">👥 Up to 8 friends</span>
                        <span className="dd-chip">⚡ Quick rounds</span>
                    </div>
                </header>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 1fr',
                        gap: 28,
                        alignItems: 'start',
                    }}
                >
                    {/* Hero card */}
                    <div className="dd-card tilt-l" style={{ padding: 36 }}>
                        <div
                            style={{
                                position: 'absolute',
                                top: -12,
                                left: '50%',
                                transform: 'translateX(-50%) rotate(-2deg)',
                                width: 110,
                                height: 22,
                                background: 'var(--crayon-sun)',
                                opacity: 0.8,
                                borderLeft: '1px dashed rgba(0,0,0,0.15)',
                                borderRight: '1px dashed rgba(0,0,0,0.15)',
                                pointerEvents: 'none',
                            }}
                        />
                        <h1
                            className="dd-title"
                            style={{ fontSize: 56, marginBottom: 6 }}
                        >
                            Scribble, Squint,
                            <br />
                            <span style={{ color: 'var(--crayon-coral)' }}>
                                Shout it out!
                            </span>
                        </h1>
                        <SketchUnderline
                            color="var(--crayon-sun)"
                            width={260}
                            style={{ marginTop: 4 }}
                        />
                        <p
                            style={{
                                fontSize: 16,
                                color: 'var(--ink-soft)',
                                maxWidth: 460,
                                marginTop: 16,
                                lineHeight: 1.55,
                            }}
                        >
                            A silly little drawing game for friends. Pick up a
                            crayon, doodle the word, and watch chaos unfold in
                            the chat.
                        </p>

                        {/* Mode toggle — only show if not already a join URL */}
                        {!roomCodeFromUrl && (
                            <div
                                style={{
                                    display: 'inline-flex',
                                    marginTop: 22,
                                    border: '2.5px solid var(--ink)',
                                    borderRadius: 14,
                                    background: '#fff',
                                    boxShadow: 'var(--sticker-sm)',
                                    overflow: 'hidden',
                                }}
                            >
                                {(['create', 'join'] as const).map((k, i) => (
                                    <button
                                        key={k}
                                        type="button"
                                        onClick={() => setMode(k)}
                                        style={{
                                            border: 'none',
                                            padding: '10px 18px',
                                            fontFamily: 'var(--font-ui)',
                                            fontWeight: 800,
                                            fontSize: 14,
                                            background:
                                                mode === k
                                                    ? 'var(--ink)'
                                                    : 'transparent',
                                            color:
                                                mode === k
                                                    ? '#fff'
                                                    : 'var(--ink)',
                                            cursor: 'pointer',
                                            borderLeft:
                                                i === 0
                                                    ? 'none'
                                                    : '2.5px solid var(--ink)',
                                        }}
                                    >
                                        {k === 'create'
                                            ? 'Create a room'
                                            : 'Join with code'}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div
                            style={{
                                marginTop: 22,
                                display: 'grid',
                                gap: 16,
                                maxWidth: 460,
                            }}
                        >
                            <div>
                                <label className="dd-label">
                                    <span>Your name</span>
                                </label>
                                <input
                                    className="dd-input"
                                    value={playerName ?? ''}
                                    onChange={(e) =>
                                        setPlayerName(e.target.value)
                                    }
                                    placeholder="e.g. Picasso"
                                    maxLength={14}
                                    autoFocus
                                />
                            </div>
                            {isJoinMode && !roomCodeFromUrl && (
                                <div>
                                    <label className="dd-label">
                                        <span>Room code</span>
                                        <span
                                            style={{
                                                fontSize: 11,
                                                color: 'var(--ink-faint)',
                                                fontWeight: 600,
                                                textTransform: 'none',
                                            }}
                                        >
                                            6 letters from your friend
                                        </span>
                                    </label>
                                    <input
                                        className="dd-input"
                                        value={joinCode}
                                        onChange={(e) =>
                                            setJoinCode(
                                                e.target.value.toUpperCase()
                                            )
                                        }
                                        placeholder="ABCDEF"
                                        maxLength={6}
                                        style={{
                                            fontFamily: 'var(--font-hand)',
                                            fontSize: 22,
                                            letterSpacing: 4,
                                            textTransform: 'uppercase',
                                        }}
                                    />
                                </div>
                            )}
                            {roomCodeFromUrl && (
                                <div
                                    style={{
                                        padding: '10px 14px',
                                        background: 'var(--paper-warm)',
                                        border: '2px dashed var(--ink)',
                                        borderRadius: 14,
                                        fontFamily: 'var(--font-hand)',
                                        fontSize: 18,
                                    }}
                                >
                                    Joining room:{' '}
                                    <strong>{roomCodeFromUrl}</strong>
                                </div>
                            )}
                            <button
                                type="button"
                                className="dd-btn dd-btn--primary dd-btn--xl w-full"
                                disabled={!canGo || isLoading}
                                onClick={() => void handleGo()}
                            >
                                {isLoading
                                    ? 'Joining…'
                                    : isJoinMode
                                      ? '→  Join room'
                                      : '✏️  Start a new room'}
                            </button>
                            {error && (
                                <p
                                    style={{
                                        color: 'var(--crayon-coral)',
                                        fontWeight: 700,
                                        fontSize: 14,
                                        margin: 0,
                                    }}
                                >
                                    {error}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Preview card */}
                    <div className="dd-card tilt-r" style={{ padding: 24 }}>
                        <div
                            style={{
                                position: 'absolute',
                                top: -10,
                                left: 30,
                                width: 70,
                                height: 22,
                                background: 'var(--crayon-coral)',
                                opacity: 0.75,
                                transform: 'rotate(-7deg)',
                                pointerEvents: 'none',
                                borderLeft: '1px dashed rgba(0,0,0,0.15)',
                                borderRight: '1px dashed rgba(0,0,0,0.15)',
                            }}
                        />
                        <div
                            style={{
                                fontFamily: 'var(--font-hand)',
                                fontSize: 22,
                                marginBottom: 10,
                            }}
                        >
                            Who's playing?
                        </div>
                        <SketchUnderline
                            color="var(--crayon-sky)"
                            width={140}
                        />
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: 14,
                                marginTop: 18,
                            }}
                        >
                            {PREVIEW_NAMES.map((n, i) => (
                                <div
                                    key={n}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 6,
                                    }}
                                >
                                    <div
                                        className="dd-float"
                                        style={{
                                            animationDelay: `${i * 0.25}s`,
                                        }}
                                    >
                                        <PlayerAvatar seed={n} size={64} />
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 700,
                                        }}
                                    >
                                        {n}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <hr className="dd-rule" />
                        <div
                            style={{
                                display: 'flex',
                                gap: 8,
                                flexWrap: 'wrap',
                            }}
                        >
                            <span
                                className="dd-chip"
                                style={{ background: 'var(--crayon-sun)' }}
                            >
                                🎨 Basic brushes
                            </span>
                            <span
                                className="dd-chip"
                                style={{
                                    background: 'var(--crayon-leaf)',
                                    color: '#fff',
                                }}
                            >
                                ⏱ Live timer
                            </span>
                            <span
                                className="dd-chip"
                                style={{
                                    background: 'var(--crayon-sky)',
                                    color: '#fff',
                                }}
                            >
                                💬 Chat guesses
                            </span>
                            <span
                                className="dd-chip"
                                style={{
                                    background: 'var(--crayon-grape)',
                                    color: '#fff',
                                }}
                            >
                                🏆 Round scores
                            </span>
                        </div>
                    </div>
                </div>

                <footer
                    style={{
                        marginTop: '10rem',
                        textAlign: 'center',
                        color: 'var(--ink-faint)',
                        fontSize: 13,
                        fontWeight: 600,
                    }}
                >
                    Made with crayons and chaos. v1.0
                </footer>
            </div>
        </div>
    )
}
