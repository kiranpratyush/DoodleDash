import { useEffect, useMemo, useState } from 'react'

interface Props {
  initialTime?: number
  endTimeIso?: string
  onTimeUp?: () => void
}

function getRemainingSeconds(endTimeIso?: string) {
  if (!endTimeIso) {
    return 0
  }
  const endMs = new Date(endTimeIso).getTime()
  const diffMs = endMs - Date.now()
  return Math.max(0, Math.ceil(diffMs / 1000))
}

export function Timer({ initialTime = 0, endTimeIso, onTimeUp }: Props) {
  const initialSeconds = useMemo(() => {
    if (endTimeIso) {
      return getRemainingSeconds(endTimeIso)
    }
    return Math.max(0, initialTime)
  }, [endTimeIso, initialTime])

  const [time, setTime] = useState(initialSeconds)

  useEffect(() => {
    setTime(initialSeconds)
  }, [initialSeconds])

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
