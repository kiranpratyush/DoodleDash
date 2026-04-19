import type { ReactNode } from 'react'

export function DDLabel({ children, hint }: { children: ReactNode; hint?: string }) {
    return (
        <label className="dd-label">
            <span>{children}</span>
            {hint && <span style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>{hint}</span>}
        </label>
    )
}

export function DDStepper({ value, onChange, min = 1, max = 20, step = 1, disabled = false }: {
    value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; disabled?: boolean
}) {
    return (
        <div className="dd-stepper" style={{ opacity: disabled ? 0.5 : 1 }}>
            <button type="button" onClick={() => !disabled && onChange(Math.max(min, value - step))} disabled={disabled} aria-label="decrease">–</button>
            <div className="val">{value}</div>
            <button type="button" onClick={() => !disabled && onChange(Math.min(max, value + step))} disabled={disabled} aria-label="increase">+</button>
        </div>
    )
}

export function SketchUnderline({ color = '#EF6C4A', width = 220, style }: {
    color?: string; width?: number; style?: React.CSSProperties
}) {
    return (
        <svg width={width} height="12" viewBox="0 0 220 12" style={{ display: 'block', ...style }}>
            <path d="M2 8 Q 40 2, 80 6 T 160 7 T 218 5" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
        </svg>
    )
}

export function Tape({ top = -10, left = 20, rotate = -6, color = '#F5B841', w = 70 }: {
    top?: number; left?: number; rotate?: number; color?: string; w?: number
}) {
    return (
        <div style={{
            position: 'absolute', top, left, width: w, height: 22,
            background: color, opacity: 0.75,
            transform: `rotate(${rotate}deg)`,
            borderLeft: '1px dashed rgba(0,0,0,0.15)',
            borderRight: '1px dashed rgba(0,0,0,0.15)',
            boxShadow: '0 1px 0 rgba(0,0,0,0.08)',
            pointerEvents: 'none',
        }} />
    )
}

export function CenterTape({ color = '#F5B841', w = 110 }: { color?: string; w?: number }) {
    return (
        <div style={{
            position: 'absolute', top: -12, left: '50%',
            transform: 'translateX(-50%) rotate(-2deg)',
            width: w, height: 22, background: color, opacity: 0.8,
            borderLeft: '1px dashed rgba(0,0,0,0.15)',
            borderRight: '1px dashed rgba(0,0,0,0.15)',
            pointerEvents: 'none',
        }} />
    )
}
