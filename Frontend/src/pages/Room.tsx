import { useState } from 'react'
import { Canvas } from '../components/Canvas'
import { Palette } from '../components/Palette'
import { Player } from '../components/Player'
import { Guess } from '../components/Guess'
import { GuessWord } from '../components/GuessWord'
import { useGameStore } from '../store/gameStore'
import { GameOver } from '../components/GameOver'
import { RoundOver } from '../components/RoundOver'
import { WordPicker, WaitingForWordToBeChoosen } from '../components/WordPicker'
import { Timer } from '../components/Timer'
import { useRoomHubSubscriptions } from '../hooks/useRoomHubSubscriptions'
import { BrandMark } from '../components/doodle'
import type { RoomOverlay } from '../types'

function RenderOverlay(overlay: RoomOverlay) {
    switch (overlay.type) {
        case 'select':
            return <WordPicker wordOptions={overlay.options} time={overlay.time} />
        case 'waiting':
            return <WaitingForWordToBeChoosen playerName={overlay.activePlayerName} time={overlay.time} />
        case 'roundover':
            return <RoundOver />
        case 'gameover':
            return <GameOver />
        case 'default':
            return null
    }
}

export default function Room() {
    useRoomHubSubscriptions()

    const [color, setColor] = useState('#2B2A27')
    const [brushSize, setBrushSize] = useState(5)
    const [tool, setTool] = useState<'brush' | 'eraser'>('brush')

    const gameStatus = useGameStore((s) => s.gameStatus)
    const activePlayerId = useGameStore((s) => s.activePlayerId)
    const currentPlayer = useGameStore((s) => s.currentPlayer)
    const roundEndTime = useGameStore((s) => s.roundEndTime)
    const roundDrawTimeSeconds = useGameStore((s) => s.drawTimeSeconds)
    const overlay = useGameStore((s) => s.overlay)
    const canvasClearSignal = useGameStore((s) => s.canvasClearSignal)
    const incrementClearSignal = useGameStore((s) => s.incrementCanvasClearSignal)

    const isDrawer = gameStatus === 'Drawing' && !!activePlayerId && currentPlayer?.id === activePlayerId
    const drawColor = tool === 'eraser' ? '#FFFFFF' : color

    return (
        <div className="paper-bg" style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Top bar */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px',
                borderBottom: '2.5px solid var(--ink)',
                background: '#fff',
                flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <BrandMark size={36} />
                    <div style={{ fontFamily: 'var(--font-hand)', fontSize: 20, lineHeight: 1 }}>DoodleDash</div>
                </div>

                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18 }}>
                    {gameStatus === 'Drawing' && (
                        <>
                            <Timer endTimeIso={roundEndTime} timeCount={roundDrawTimeSeconds} />
                            <GuessWord />
                        </>
                    )}
                    {gameStatus === 'SelectingWord' && (
                        <div style={{ fontFamily: 'var(--font-hand)', fontSize: 20, color: 'var(--ink-soft)' }}>
                            Selecting a word…
                        </div>
                    )}
                </div>

                <div style={{ flexShrink: 0 }} />
            </div>

            {/* Main 3-column layout */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '240px 1fr 280px', gap: 14, padding: '14px 16px 16px', minHeight: 0 }}>
                {/* Left — Scoreboard */}
                <div style={{ minHeight: 0 }}>
                    <Player />
                </div>

                {/* Center — Canvas + Palette */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0, minWidth: 0 }}>
                    <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                        <Canvas
                            color={drawColor}
                            brushSize={brushSize}
                            clearSignal={canvasClearSignal}
                            isDrawingAllowed={isDrawer}
                            throttleInMs={50}
                        />
                        {overlay.type !== 'default' && (
                            <div style={{ position: 'absolute', inset: 0 }}>
                                {RenderOverlay(overlay)}
                            </div>
                        )}
                    </div>
                    <Palette
                        color={color}
                        setColor={setColor}
                        brushSize={brushSize}
                        setBrushSize={setBrushSize}
                        tool={tool}
                        setTool={setTool}
                        onClear={incrementClearSignal}
                        disabled={!isDrawer}
                    />
                </div>

                {/* Right — Chat */}
                <div style={{ minHeight: 0 }}>
                    <Guess />
                </div>
            </div>
        </div>
    )
}
