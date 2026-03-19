import { useEffect, useState } from 'react'
import { Canvas } from '../components/canvas'
import { ColorPicker } from '../components/colorPicker'
import { Player } from '../components/player'
import { Guess } from '../components/guess'
import { GuessWord } from '../components/guessWord'
import { Timer } from '../components/timer'
import { useGameStore } from '../store/gameStore'
import { gameHubService } from '../services/gameHubService'

export default function Room() {
    const [color, setColor] = useState('#000000')
    const [brushSize] = useState(3)
    const upsertPlayer = useGameStore((state) => state.upsertPlayer)
    const removePlayer = useGameStore((state) => state.removePlayer)
    const addChatMessage = useGameStore((state) => state.addChatMessage)

    useEffect(() => {
        const cleanupJoined = gameHubService.onPlayerJoined((player) => {
            console.log(player)
            if (!player) {
                return
            }
            upsertPlayer(player)
            addChatMessage({
                playerId: 'system',
                playerName: 'System',
                message: `${player.name} joined`,
                messageType: 'System',
            })
        })
        const cleanupLeft = gameHubService.onPlayerLeft((player) => {
            if (!player) {
                return
            }
            removePlayer(player.id)
            addChatMessage({
                playerId: 'system',
                playerName: 'System',
                message: `${player.name} left`,
                messageType: 'System',
            })
        })

        return () => {
            cleanupJoined()
            cleanupLeft()
        }
    }, [addChatMessage, removePlayer, upsertPlayer])

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
