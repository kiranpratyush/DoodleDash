import { useEffect, useState } from 'react'
import { Canvas } from '../components/canvas'
import { ColorPicker } from '../components/colorPicker'
import { Player } from '../components/player'
import { Guess } from '../components/guess'
import { GuessWord } from '../components/guessWord'
import { Timer } from '../components/timer'
import { gameHubService } from '../services/gameHubService'
import { type Pos } from '../../types'

export default function Room() {
    const [color, setColor] = useState('#000000')
    const [brushSize] = useState(3)

    function sendDraw(prevPos: Pos, curPos: Pos) {
        gameHubService.sendDataPoints({
            x0: prevPos.x,
            y0: prevPos.y,
            x1: curPos.x,
            y1: curPos.y,
            brushSize: brushSize,
            color: color,
            playerId: '1',
        })
        console.log([prevPos.x, prevPos.y, curPos.x, curPos.y])
    }

    return (
        <div className="flex flex-col gradient-bg">
            <h1 className="text-3xl font-bold text-center mb-6 text-gray-700 self-center">
                Doodle Dash
            </h1>
            <div className="flex items-center justify-center gap-4 mb-4">
                <Timer initialTime={60} />
                <GuessWord word="elephant" revealedIndices={[0, 3, 7]} />
            </div>
            <div className="h-screen flex pt-4 px-4 gap-4">
                <div className="flex-1 max-h-[70%]">
                    <Player />
                </div>
                <div className="flex flex-col h-[80vh] rounded-sm flex-3">
                    <Canvas
                        color={color}
                        brushSize={brushSize}
                        isDrawingAllowed={true}
                        throttleInMs={50}
                    }
                    />
                    <ColorPicker
                        activeColor={color}
                        setActiveColor={setColor}
                    />
                </div>
                <div className="flex-1 max-h-[70%]">
                    <Guess />
                </div>
            </div>
        </div>
    )
}
