import { useEffect, useRef, type MouseEvent } from 'react'
import { setupResponsiveCanvas } from './canvasActions'
import { type Pos, type DataPoint } from '../types/pos'

interface Props {
    color: string
    brushSize: number
    isDrawingAllowed: boolean
    throttleInMs: number
    sendDraw: (prevPos: Pos, currentPos: Pos) => void
    onReceiveDraw?: (callback: (point: DataPoint) => void) => void
}

export function Canvas(prop: Props) {
    const containerRef = useRef<null | HTMLDivElement>(null)
    const canvasRef = useRef<null | HTMLCanvasElement>(null)
    const contextRef = useRef<CanvasRenderingContext2D | null>(null)
    const prevPosRef = useRef<Pos>({ x: -1, y: -1 })
    const prevNetWorkPosRef = useRef<Pos>({ x: -1, y: -1 })
    const isDrawingRef = useRef<boolean>(false)
    const lastSentRef = useRef(0)

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

    function sendDrawData(x: number, y: number) {
        prop.sendDraw(prevNetWorkPosRef.current, { x, y })
        prevNetWorkPosRef.current = { x, y }
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
            sendDrawData(x, y)
            lastSentRef.current = now
        }
    }

    function stopDrawing() {
        isDrawingRef.current = false
    }

    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (canvas && container && canvas.getContext) {
            setupResponsiveCanvas(canvas, container)
            const ctx = canvas.getContext('2d')
            contextRef.current = ctx
            if (ctx) {
                ctx.fillStyle = '#FFFFFF'
                ctx.fillRect(0, 0, canvas.width, canvas.height)
            }
        }
        prop.onReceiveDraw?.((point) => {
            draw(
                { x: point.x0, y: point.y0 },
                { x: point.x1, y: point.y1 },
                point.color,
                point.brushSize
            )
        })
    }, [])

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
