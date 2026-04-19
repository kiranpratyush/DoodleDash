import { useEffect, useRef } from 'react'

function hashStr(s: string): number {
    let h = 2166136261 >>> 0
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i)
        h = Math.imul(h, 16777619)
    }
    return h >>> 0
}

const CRAYONS = ['#EF6C4A','#F5B841','#6DAA5A','#4A9DD9','#9A6FB0','#D94A77','#57C7A4']
function pick<T>(arr: T[], n: number): T { return arr[n % arr.length] }

export function PlayerAvatar({ seed = 'player', size = 56, color, ring = true }: {
    seed?: string; size?: number; color?: string; ring?: boolean
}) {
    const h = hashStr(seed)
    const hue = color ?? pick(CRAYONS, h)
    const eyeStyle = h % 4
    const mouthStyle = (h >> 3) % 4
    const blush = ((h >> 6) & 1) === 1
    const hatStyle = (h >> 7) % 5
    const faceShape = (h >> 10) % 3
    const id = 'av-' + h.toString(36)

    let face
    if (faceShape === 0)
        face = <circle cx="32" cy="34" r="22" fill={hue} stroke="#2B2A27" strokeWidth="2.5" />
    else if (faceShape === 1)
        face = <ellipse cx="32" cy="34" rx="20" ry="23" fill={hue} stroke="#2B2A27" strokeWidth="2.5" />
    else
        face = <rect x="11" y="14" width="42" height="42" rx="12" fill={hue} stroke="#2B2A27" strokeWidth="2.5" />

    let eyes
    if (eyeStyle === 0)
        eyes = <><circle cx="25" cy="32" r="2.4" fill="#2B2A27" /><circle cx="39" cy="32" r="2.4" fill="#2B2A27" /></>
    else if (eyeStyle === 1)
        eyes = <><path d="M22 32 L28 32" stroke="#2B2A27" strokeWidth="2.4" strokeLinecap="round" /><path d="M36 32 L42 32" stroke="#2B2A27" strokeWidth="2.4" strokeLinecap="round" /></>
    else if (eyeStyle === 2)
        eyes = <><path d="M22 33 Q25 29 28 33" fill="none" stroke="#2B2A27" strokeWidth="2.4" strokeLinecap="round" /><path d="M36 33 Q39 29 42 33" fill="none" stroke="#2B2A27" strokeWidth="2.4" strokeLinecap="round" /></>
    else
        eyes = <><path d="M23 30 L27 34 M27 30 L23 34" stroke="#2B2A27" strokeWidth="2" strokeLinecap="round" /><circle cx="39" cy="32" r="2.4" fill="#2B2A27" /></>

    let mouth
    if (mouthStyle === 0)
        mouth = <path d="M26 42 Q32 47 38 42" fill="none" stroke="#2B2A27" strokeWidth="2.4" strokeLinecap="round" />
    else if (mouthStyle === 1)
        mouth = <path d="M25 41 Q32 50 39 41 Z" fill="#2B2A27" />
    else if (mouthStyle === 2)
        mouth = <ellipse cx="32" cy="43" rx="3" ry="3.5" fill="#2B2A27" />
    else
        mouth = <><path d="M26 42 Q32 46 38 42" fill="none" stroke="#2B2A27" strokeWidth="2.4" strokeLinecap="round" /><path d="M30 44 Q32 48 34 44" fill="#EF6C4A" stroke="#2B2A27" strokeWidth="1.4" /></>

    const blushEls = blush ? <><circle cx="22" cy="40" r="2.5" fill="#EF6C4A" opacity="0.55" /><circle cx="42" cy="40" r="2.5" fill="#EF6C4A" opacity="0.55" /></> : null

    let top = null
    if (hatStyle === 1)
        top = <path d="M24 15 Q28 7 32 13 Q36 7 40 15" fill="none" stroke="#2B2A27" strokeWidth="2.4" strokeLinecap="round" />
    else if (hatStyle === 2)
        top = <><path d="M16 17 Q32 4 48 17 L46 20 L18 20 Z" fill="#2B2A27" /><circle cx="32" cy="6" r="3" fill="#F5B841" stroke="#2B2A27" strokeWidth="1.5" /></>
    else if (hatStyle === 3)
        top = <path d="M20 15 L24 8 L28 13 L32 6 L36 13 L40 8 L44 15 Z" fill="#F5B841" stroke="#2B2A27" strokeWidth="2" strokeLinejoin="round" />
    else if (hatStyle === 4)
        top = <><path d="M32 14 L32 6" stroke="#2B2A27" strokeWidth="2" strokeLinecap="round" /><circle cx="32" cy="5" r="3" fill="#EF6C4A" stroke="#2B2A27" strokeWidth="2" /></>

    return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-label={`avatar ${seed}`}>
            <defs>
                <filter id={id + '-wob'}>
                    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed={h % 10} />
                    <feDisplacementMap in="SourceGraphic" scale="0.6" />
                </filter>
            </defs>
            {ring && <circle cx="32" cy="32" r="30" fill="#FFF" stroke="#2B2A27" strokeWidth="2.5" />}
            <g filter={`url(#${id}-wob)`}>
                {face}{blushEls}{eyes}{mouth}{top}
            </g>
        </svg>
    )
}

export function BrandMark({ size = 64 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="#F5B841" stroke="#2B2A27" strokeWidth="3" />
            <path d="M16 48 Q24 30 34 44 T54 40 T64 48" fill="none" stroke="#2B2A27" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M58 22 L68 12 L72 16 L62 26 Z" fill="#EF6C4A" stroke="#2B2A27" strokeWidth="2" strokeLinejoin="round" />
            <path d="M58 22 L62 26" stroke="#2B2A27" strokeWidth="2" />
        </svg>
    )
}

function SelfDrawScribble({ d, color = '#2B2A27', width = 3, delay = 0, duration = 1400 }: {
    d: string; color?: string; width?: number; delay?: number; duration?: number
}) {
    const ref = useRef<SVGPathElement>(null)
    useEffect(() => {
        const el = ref.current
        if (!el) return
        const len = el.getTotalLength()
        el.style.strokeDasharray = String(len)
        el.style.strokeDashoffset = String(len)
        el.style.animation = `dd-draw ${duration}ms ease-out ${delay}ms forwards`
    }, [d, delay, duration])
    return <path ref={ref} d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
}

export function DoodleBackdrop() {
    const items = [
        { d: "M10 40 Q30 10 60 40 T110 40", x: 5,  y: 12, c: '#F5B841', delay: 0 },
        { d: "M0 0 C 10 -20 40 -20 50 0 C 40 20 10 20 0 0 Z", x: 78, y: 8,  c: '#EF6C4A', delay: 300 },
        { d: "M0 20 L20 0 L40 20 L20 40 Z", x: 6,  y: 70, c: '#4A9DD9', delay: 600 },
        { d: "M0 0 Q20 -10 40 0 Q30 20 0 20 Z", x: 82, y: 65, c: '#6DAA5A', delay: 900 },
        { d: "M0 10 Q5 0 10 10 Q15 20 20 10 Q25 0 30 10", x: 45, y: 6, c: '#9A6FB0', delay: 400 },
        { d: "M0 0 L10 10 M10 0 L0 10", x: 35, y: 82, c: '#D94A77', delay: 800 },
    ]
    return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.35 }}>
            {items.map((it, i) => (
                <g key={i} transform={`translate(${it.x} ${it.y}) scale(0.18)`}>
                    <SelfDrawScribble d={it.d} color={it.c} width={6} delay={it.delay} />
                </g>
            ))}
        </svg>
    )
}

const FLOAT_DOODLES = [
    "M0 40 Q20 0 40 30 T80 20",
    "M0 0 L0 40 L40 40 L40 0 Z",
    "M20 0 L20 40 M0 20 L40 20",
    "M20 0 A20 20 0 1 0 20 40 A20 20 0 1 0 20 0 Z",
    "M0 40 L20 0 L40 40 Z",
]
const FLOAT_COLORS = ['#EF6C4A','#F5B841','#6DAA5A','#4A9DD9','#9A6FB0']
const FLOAT_POSITIONS = [
    { top: '8%',  left: '4%' },
    { top: '14%', right: '6%' },
    { top: '62%', left: '3%' },
    { top: '70%', right: '8%' },
    { top: '40%', left: '46%' },
]

export function FloatingDoodles() {
    return (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.45 }}>
            {FLOAT_POSITIONS.map((p, i) => (
                <div key={i} className="dd-float" style={{ position: 'absolute', ...p, animationDelay: `${i * 0.4}s` }}>
                    <svg width="64" height="64" viewBox="-10 -10 60 60">
                        <SelfDrawScribble d={FLOAT_DOODLES[i % FLOAT_DOODLES.length]} color={FLOAT_COLORS[i % FLOAT_COLORS.length]} width={4} duration={2200} delay={i * 250} />
                    </svg>
                </div>
            ))}
        </div>
    )
}
