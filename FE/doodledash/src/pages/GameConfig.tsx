import { DoodleDashButton } from '../design-system/button'
import { DoodleDashInput } from '../design-system/input'

const data = [
    {
        type: 'Players',
        data: 8,
    },
    {
        type: 'Rounds',
        data: 3,
    },
    {
        type: 'Draw Time (seconds)',
        data: 20,
    },
]

export default function GameConfig() {
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
                                    onInput={() => {}}
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
                        />
                    </div>
                    <DoodleDashButton size="l" label="Start Game" />
                    <DoodleDashButton size="l" label="Invite" />
                </div>
            </div>
        </div>
    )
}
