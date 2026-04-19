const CRAYON_COLORS = [
    '#2B2A27', '#8B867B', '#FFFFFF',
    '#EF6C4A', '#D94A77', '#F5B841',
    '#6DAA5A', '#57C7A4', '#4A9DD9',
    '#9A6FB0', '#8B4513', '#F8C8DC',
]

export const BRUSH_SIZES = [2, 5, 10, 18]

interface Props {
    color: string
    setColor: (c: string) => void
    brushSize: number
    setBrushSize: (s: number) => void
    tool: 'brush' | 'eraser'
    setTool: (t: 'brush' | 'eraser') => void
    onClear: () => void
    disabled: boolean
}

function ToolBtn({ children, active, danger = false, onClick, label }: {
    children: React.ReactNode; active?: boolean; danger?: boolean; onClick: () => void; label: string
}) {
    return (
        <button type="button" onClick={onClick} title={label} style={{
            width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2.5px solid var(--ink)', borderRadius: 10,
            background: active ? 'var(--crayon-sun)' : (danger ? 'var(--paper-warm)' : '#fff'),
            cursor: 'pointer', fontSize: 16, boxShadow: 'var(--sticker-sm)',
        }}>
            {children}
        </button>
    )
}

export function Palette({ color, setColor, brushSize, setBrushSize, tool, setTool, onClear, disabled }: Props) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            padding: '12px 14px',
            background: '#fff',
            border: '2.5px solid var(--ink)',
            borderRadius: 'var(--r-lg)',
            boxShadow: 'var(--sticker)',
            opacity: disabled ? 0.5 : 1,
            pointerEvents: disabled ? 'none' : 'auto',
        }}>
            {/* Colors */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 28px)', gap: 5 }}>
                {CRAYON_COLORS.map((c) => (
                    <button key={c} type="button"
                        onClick={() => { setColor(c); setTool('brush') }}
                        title={c}
                        style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: c === '#FFFFFF' ? '#fff' : c,
                            border: '2.5px solid var(--ink)',
                            cursor: 'pointer',
                            boxShadow: c === color && tool !== 'eraser' ? '0 0 0 3px var(--crayon-sun)' : 'var(--sticker-sm)',
                            transform: c === color && tool !== 'eraser' ? 'translateY(-2px)' : 'none',
                            transition: 'transform 120ms var(--ease)',
                        }}
                    />
                ))}
            </div>

            <div style={{ width: 2, alignSelf: 'stretch', background: 'var(--ink-ghost)' }} />

            {/* Brush sizes */}
            <div style={{ display: 'flex', gap: 5 }}>
                {BRUSH_SIZES.map((s) => (
                    <button key={s} type="button" onClick={() => setBrushSize(s)} title={`${s}px`} style={{
                        width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: brushSize === s ? 'var(--paper-warm)' : '#fff',
                        border: '2.5px solid var(--ink)', borderRadius: 10, cursor: 'pointer',
                        boxShadow: brushSize === s ? 'var(--sticker)' : 'var(--sticker-sm)',
                    }}>
                        <div style={{ width: s + 3, height: s + 3, borderRadius: '50%', background: 'var(--ink)' }} />
                    </button>
                ))}
            </div>

            <div style={{ width: 2, alignSelf: 'stretch', background: 'var(--ink-ghost)' }} />

            {/* Tools */}
            <div style={{ display: 'flex', gap: 8 }}>
                <ToolBtn label="Eraser" active={tool === 'eraser'} onClick={() => setTool('eraser')}>🧽</ToolBtn>
                <ToolBtn label="Clear" danger onClick={onClear}>🗑</ToolBtn>
            </div>
        </div>
    )
}
