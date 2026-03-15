import { useState } from 'react'
import { DoodleDashButton } from '../design-system/button'
import { DoodleDashInput } from '../design-system/input'
import { useLocalInputs } from '../store/inputStore'
import { startGame } from '../services/gameService'

export default function GameConfig() {
    const setMaxPlayers = useLocalInputs((state) => state.setMaxPlayers)
    const setTotalRounds = useLocalInputs((state) => state.setMaxRounds)
    const setDrawTime = useLocalInputs((state) => state.setDrawTime)
    const setCustomWords = useLocalInputs((state) => state.setCustomWords)
    const customWords = useLocalInputs((state) => state.localInputs.customWords)
    const setCurrentScreen = useLocalInputs((state) => state.setCurrentScreen)
    const [isLoading, setIsLoading] = useState(false)

    const handleStartGameButton = async () => {
        setIsLoading(true)
        await startGame(300)
        setCurrentScreen('ROOM')
    }

    const data = [
        {
            type: 'Max Allowed Players',
            data: useLocalInputs((state) => state.localInputs.maxPlayers),
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                setMaxPlayers(parseInt(event.target.value))
            },
        },
        {
            type: 'Total Rounds',
            data: useLocalInputs((state) => state.localInputs.maxRounds),
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                setTotalRounds(parseInt(event.target.value))
            },
        },
        {
            type: 'Draw Time (seconds)',
            data: useLocalInputs((state) => state.localInputs.drawTimeInSecond),
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                setDrawTime(parseInt(event.target.value))
            },
        },
    ]

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg p-8 rounded-lg shadow-xl">
                <h1 className="text-2xl font-bold text-gray-800 mb-8 text-center">
                    Game Settings
                </h1>
                <div className="flex flex-col gap-6">
                    {data.map((d) => {
                        return (
                            <div key={d.type} className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-700">
                                    {d.type}
                                </label>
                                <DoodleDashInput
                                    type="number"
                                    placeHolder=""
                                    onChange={d.onChange}
                                    value={d.data.toString()}
                                />
                            </div>
                        )
                    })}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">
                            Custom Words
                        </label>
                        <textarea
                            className="h-32 w-full p-2 border-2 border-emerald-400 rounded-sm outline-emerald-600 resize-none text-lg"
                            placeholder="Enter words separated by commas..."
                            onChange={(
                                event: React.ChangeEvent<HTMLTextAreaElement>
                            ) => {
                                setCustomWords(event.target.value)
                            }}
                        />
                    </div>
                    <DoodleDashButton
                        size="l"
                        label="Start Game"
                        onClick={handleStartGameButton}
                        isLoading={isLoading}
                        isLoadingLabel="Starting..."
                    />
                    <DoodleDashButton
                        size="l"
                        label="Invite"
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </div>
    )
}
