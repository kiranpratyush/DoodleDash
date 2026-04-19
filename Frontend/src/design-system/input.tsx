interface DoodleDashInputProps {
    placeHolder: string
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
    type: string
    id?: string
    value: string | null
    disabled?: boolean
}

export function DoodleDashInput({
    placeHolder,
    onChange,
    type,
    id,
    value,
    disabled,
}: DoodleDashInputProps) {
    return (
        <input
            className="dd-input"
            type={type}
            placeholder={placeHolder}
            onChange={onChange}
            id={id}
            value={value || ''}
            disabled={disabled}
        />
    )
}
