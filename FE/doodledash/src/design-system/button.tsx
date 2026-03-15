interface DoodleDashButtonProps {
    size: 's' | 'm' | 'l'
    label: string
    onClick?: (event?: React.MouseEvent<HTMLButtonElement>) => void
    isLoading?: boolean
    isLoadingLabel?: string
}

export function DoodleDashButton({
    label,
    onClick,
    isLoading,
    isLoadingLabel,
}: DoodleDashButtonProps) {
    return (
        <button
            className="p-4 bg-emerald-400 rounded-sm cursor-pointer w-full"
            onClick={onClick}
            disabled={isLoading}
        >
            {isLoading ? isLoadingLabel : label}
        </button>
    )
}
