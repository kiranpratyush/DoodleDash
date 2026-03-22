import { useState } from 'react'
import { Canvas } from '../components/Canvas'
import { ColorPicker } from '../components/ColorPicker'
import { Player } from '../components/Player'
import { Guess } from '../components/Guess'
import { GuessWord } from '../components/GuessWord'
import { useGameStore } from '../store/gameStore'
import { GameOver } from '../components/GameOver'
import { RoundOver } from '../components/RoundOver'
import { WordPicker, WaitingForWordToBeChoosen } from '../components/WordPicker'
import { Timer } from '../components/Timer'
import { useRoomHubSubscriptions } from '../hooks/useRoomHubSubscriptions'
import { type RoomOverlay } from '../types'

function RenderOverlay(overlay: RoomOverlay) {
    switch (overlay.type) {
        case 'select':
            return <WordPicker wordOptions={overlay.options} time={overlay.time} />
        case 'waiting':
            return (
                <WaitingForWordToBeChoosen
                    playerName={overlay.activePlayerName}
                    time={overlay.time}
                />
            )
        case 'roundover':
            return <RoundOver />
        case 'gameover':
            return <GameOver />
        case 'default':
            return
    }
}

export default function Room() {
    useRoomHubSubscriptions()

    const [color, setColor] = useState('#000000')
    const [brushSize] = useState(3)
    const gameStatus = useGameStore((state) => state.gameStatus)
    const activePlayerId = useGameStore((state) => state.activePlayerId)
    const currentPlayer = useGameStore((state) => state.currentPlayer)
    const roundEndTime = useGameStore((state) => state.roundEndTime)
    const roundDrawTimeSeconds = useGameStore((state) => state.drawTimeSeconds)
    const overlay = useGameStore((state) => state.overlay)
    const canvasClearSignal = useGameStore((state) => state.canvasClearSignal)

    return (
        <div className="flex flex-col gradient-bg">
            <h1 className="text-3xl font-bold text-center mb-6 text-gray-700 self-center">
                Doodle Dash
            </h1>
            <div className="flex items-center justify-center gap-4 mb-4">
                {gameStatus == 'Drawing' && (
                    <>
                        <Timer
                            endTimeIso={roundEndTime}
                            timeCount={roundDrawTimeSeconds}
                        />
                        <GuessWord />
                    </>
                )}
            </div>
            <div className="h-screen flex pt-4 px-4 gap-4">
                <div className="flex-1 max-h-[70%]">
                    <Player />
                </div>
                <div className="flex flex-col h-[80vh] rounded-sm flex-3 relative max-w-xlg">
                    <Canvas
                        color={color}
                        brushSize={brushSize}
                        clearSignal={canvasClearSignal}
                        isDrawingAllowed={
                            gameStatus == 'Drawing' &&
                            activePlayerId != undefined &&
                            currentPlayer?.id == activePlayerId
                        }
                        throttleInMs={50}
                    />
                    <ColorPicker
                        activeColor={color}
                        setActiveColor={setColor}
                    />
                    {overlay.type != 'default' && (
                        <div className="absolute h-full w-full">
                            {RenderOverlay(overlay)}
                        </div>
                    )}
                </div>
                <div className="flex-1 max-h-[70%]">
                    <Guess />
                </div>
            </div>
        </div>
    )
}
