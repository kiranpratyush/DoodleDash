import { useEffect, useRef, type MouseEvent } from 'react'
import { setupResponsiveCanvas } from './CanvasActions'
import { type Pos } from '../types'
import { gameHubService } from '../services/gameHubService'
import { useGameStore } from '../store/gameStore'

export interface Props {
    color: string
    brushSize: number
    isDrawingAllowed: boolean
    throttleInMs: number
    clearSignal: number
}

export function Canvas(prop: Props) {
    const containerRef = useRef<null | HTMLDivElement>(null)
    const canvasRef = useRef<null | HTMLCanvasElement>(null)
    const contextRef = useRef<CanvasRenderingContext2D | null>(null)
    const prevPosRef = useRef<Pos>({ x: -1, y: -1 })
    const prevNetWorkPosRef = useRef<Pos>({ x: -1, y: -1 })
    const isDrawingRef = useRef<boolean>(false)
    const lastSentRef = useRef(0)
    const roomCode = useGameStore((state) => state.roomCode)
    const playerId = useGameStore((state) => state.currentPlayer?.id)

    function sendDraw(x: number, y: number) {
        if (playerId) {
            gameHubService.sendDataPoints({
                x0: prevNetWorkPosRef.current.x,
                y0: prevNetWorkPosRef.current.y,
                x1: x,
                y1: y,
                brushSize: prop.brushSize,
                color: prop.color,
                playerId: playerId,
                roomCode: roomCode,
            })
            prevNetWorkPosRef.current = { x, y }
        }
    }

    function draw(
        prevPos: Pos,
        currPos: Pos,
        color: string,
        brushSize: number
    ) {
        const ctx = contextRef.current
        if (!ctx) return
        ctx.strokeStyle = color
        ctx.lineWidth = brushSize
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(prevPos.x, prevPos.y)
        ctx.lineTo(currPos.x, currPos.y)
        ctx.stroke()
    }

    function onMouseDown(event: MouseEvent<HTMLCanvasElement>) {
        const rect = canvasRef.current!.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top
        prevPosRef.current = { x: x, y: y }
        prevNetWorkPosRef.current = { x: x, y: y }
        if (prop.isDrawingAllowed) {
            isDrawingRef.current = true
        }
    }

    function onMouseMove(event: MouseEvent<HTMLCanvasElement>) {
        if (!isDrawingRef.current) {
            return
        }
        const rect = canvasRef.current!.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top
        draw(prevPosRef.current, { x, y }, prop.color, prop.brushSize)
        prevPosRef.current = { x, y }
        const now = Date.now()
        if (now - lastSentRef.current >= prop.throttleInMs) {
            sendDraw(x, y)
            lastSentRef.current = now
        }
    }

    function stopDrawing() {
        isDrawingRef.current = false
    }

    function clearCanvas() {
        const canvas = canvasRef.current
        const ctx = contextRef.current
        if (!canvas || !ctx) {
            return
        }
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        prevPosRef.current = { x: -1, y: -1 }
        prevNetWorkPosRef.current = { x: -1, y: -1 }
        isDrawingRef.current = false
    }

    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (canvas && container && canvas.getContext) {
            setupResponsiveCanvas(canvas, container)
            const ctx = canvas.getContext('2d')
            contextRef.current = ctx
            clearCanvas()
        }
        const cleanup = gameHubService.OnDrawData((point) => {
            draw(
                { x: point.x0, y: point.y0 },
                { x: point.x1, y: point.y1 },
                point.color,
                point.brushSize
            )
        })
        return () => {
            cleanup()
        }
    }, [])

    useEffect(() => {
        clearCanvas()
    }, [prop.clearSignal])

    return (
        <div
            ref={containerRef}
            className="h-full rounded-sm shadow-inner bg-white overflow-hidden"
        >
            <canvas
                ref={canvasRef}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="bg-white overflow-hidden"
            >
                Drawing Content Browser does not supported
            </canvas>
        </div>
    )
}
