import { useEffect, useState } from 'react'

interface Props {
    initialTime?: number
    endTimeIso?: string
    onTimeUp?: () => void
    timeCount: number
}

export function Timer({ onTimeUp, timeCount }: Props) {
    const [time, setTime] = useState(timeCount)

    useEffect(() => {
        setTime(timeCount)
    }, [timeCount])

    useEffect(() => {
        if (time <= 0) {
            onTimeUp?.()
            return
        }
        const interval = setInterval(() => setTime((prev) => prev - 1), 1000)
        return () => clearInterval(interval)
    }, [time, onTimeUp])

    const urgent = time <= 10
    const critical = time <= 5

    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '7px 14px',
            background: critical ? 'var(--crayon-coral)' : urgent ? 'var(--crayon-sun)' : '#fff',
            color: critical ? '#fff' : 'var(--ink)',
            border: '2.5px solid var(--ink)',
            borderRadius: 'var(--r-pill)',
            boxShadow: 'var(--sticker-sm)',
            fontFamily: 'var(--font-hand)',
            fontSize: 24,
            minWidth: 80,
            justifyContent: 'center',
            animation: critical ? 'dd-shake 0.4s infinite' : 'none',
            transition: 'background 300ms, color 300ms',
        }}>
            <span>⏱</span>
            <span>{time}s</span>
        </div>
    )
}
