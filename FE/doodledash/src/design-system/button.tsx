interface DoodleDashButtonProps {
    size: 's' | 'm' | 'l'
    label: string
    onClick?: (event?: React.MouseEvent<HTMLButtonElement>) => void
}

export function DoodleDashButton({ label, onClick }: DoodleDashButtonProps) {
    return (
        <button
            className="p-4 bg-emerald-400 rounded-sm cursor-pointer w-full"
            onClick={onClick}
        >
            {label}
        </button>
    )
}
