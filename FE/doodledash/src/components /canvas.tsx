import { useEffect, useRef, type MouseEvent } from 'react';
import { setupResponsiveCanvas } from './canvasActions';

interface Pos {
    x: number;
    y: number;
}

interface Props {
    color: string;
    brushSize: number;
}

export function Canvas(prop: Props) {
    const containerRef = useRef<null | HTMLDivElement>(null);
    const canvasRef = useRef<null | HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const prevPosRef = useRef<Pos>({ x: -1, y: -1 });
    const isDrawingRef = useRef<boolean>(false);

    function onMouseDown(event: MouseEvent<HTMLCanvasElement>) {
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        prevPosRef.current = { x: x, y: y };
        isDrawingRef.current = true;
    }

    function onMouseMove(event: MouseEvent<HTMLCanvasElement>) {
        if (!isDrawingRef.current) {
            return;
        }
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const ctx = contextRef.current;
        if (ctx) {
            ctx.strokeStyle = prop.color;
            ctx.lineWidth = prop.brushSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(prevPosRef.current.x, prevPosRef.current.y);
            ctx.lineTo(x, y);
            ctx.stroke();
            prevPosRef.current = { x, y };
        }
    }

    function stopDrawing() {
        isDrawingRef.current = false;
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (canvas && container && canvas.getContext) {
            setupResponsiveCanvas(canvas, container);
            const ctx = canvas.getContext('2d');
            contextRef.current = ctx;
            if (ctx) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
    }, []);

    return (
        <div ref={containerRef} className="h-[100%] bg-white rounded-sm shadow-inner bg-white overflow-hidden">
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
    );
}
