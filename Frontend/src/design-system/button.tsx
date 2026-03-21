interface DoodleDashButtonProps {
    size: 's' | 'm' | 'l'
    label: string
    onClick?: (event?: React.MouseEvent<HTMLButtonElement>) => void
    isLoading?: boolean
    isLoadingLabel?: string
    disabled?: boolean
}

export function DoodleDashButton({
    label,
    onClick,
    isLoading,
    isLoadingLabel,
    disabled,
}: DoodleDashButtonProps) {
    const isDisabled = isLoading || disabled
    return (
        <button
            className={`p-4 rounded-sm w-full ${
                isDisabled
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-emerald-400 cursor-pointer'
            }`}
            onClick={onClick}
            disabled={isDisabled}
        >
            {isLoading ? isLoadingLabel : label}
        </button>
    )
}
