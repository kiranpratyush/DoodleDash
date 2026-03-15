import { DoodleDashButton } from '../design-system/button'
import { DoodleDashInput } from '../design-system/input'

export default function Home() {
    return (
        <div className="gradient-bg min-h-screen flex items-center justify-center p-4">
            <div className="bg-white/90 backdrop-blur-sm w-full max-w-md p-8 rounded-xl shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        DoodleDash
                    </h1>
                    <p className="text-gray-600">
                        Draw, guess, and have fun with friends!
                    </p>
                </div>
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">
                            Your Name
                        </label>
                        <DoodleDashInput
                            placeHolder="Enter your name"
                            type="text"
                            onInput={() => {}}
                        />
                    </div>
                    <div className="flex flex-col gap-3">
                        <DoodleDashButton size="l" label="Create Room" />
                    </div>
                </div>
            </div>
        </div>
    )
}
