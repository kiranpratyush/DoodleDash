interface DoodleDashButtonProps {
    size: 's' | 'm' | 'l'
    label: string
}

export function DoodleDashButton({ label }: DoodleDashButtonProps) {
    return (
        <button className="p-4 bg-emerald-400 rounded-sm cursor-pointer w-full">
            {label}
        </button>
    )
}
