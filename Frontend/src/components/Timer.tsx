import { useEffect,useState } from 'react'

interface Props {
    initialTime?: number
    endTimeIso?: string
    onTimeUp?: () => void
    timeCount: number
}

export function Timer({
    onTimeUp,
    timeCount,
}: Props) {
    const [time, setTime] = useState(timeCount)

    useEffect(() => {
        if (time <= 0) {
            onTimeUp?.()
            return
        }

        const interval = setInterval(() => {
            setTime((prev) => prev - 1)
        }, 1000)

        return () => clearInterval(interval)
    }, [time, onTimeUp])

    return (
        <div className="w-8 h-8 border-2 border-solid rounded-[50%] flex justify-center items-center align-middle mr-4">
            <span
                className={`text-sm font-bold ${time > 10 ? 'text-gray-800' : 'text-red-500'}`}
            >
                {time}
            </span>
        </div>
    )
}
