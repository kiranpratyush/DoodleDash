interface DoodleDashButtonProps {
    size: 's' | 'm' | 'l'
    label: string
    onClick?: (event?: React.MouseEvent<HTMLButtonElement>) => void
    isLoading?: boolean
    isLoadingLabel?: string
    disabled?: boolean
    variant?: 'primary' | 'sun' | 'leaf' | 'sky' | 'ghost'
}

export function DoodleDashButton({
    label,
    onClick,
    isLoading,
    isLoadingLabel,
    disabled,
    size = 'm',
    variant = 'primary',
}: DoodleDashButtonProps) {
    const isDisabled = isLoading || disabled
    const cls = ['dd-btn', 'w-full']
    cls.push(`dd-btn--${variant}`)
    if (size === 'l') cls.push('dd-btn--xl')
    else if (size === 'm') cls.push('dd-btn--lg')

    return (
        <button
            className={cls.join(' ')}
            onClick={onClick}
            disabled={isDisabled}
        >
            {isLoading ? isLoadingLabel : label}
        </button>
    )
}
