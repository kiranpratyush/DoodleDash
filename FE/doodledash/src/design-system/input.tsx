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
            className={`p-2 border-2 text-lg h-8 rounded-sm inline-block w-full ${
                disabled
                    ? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'border-emerald-400 outline-emerald-600'
            }`}
            type={type}
            placeholder={placeHolder}
            onChange={onChange}
            id={id}
            value={value || ''}
            disabled={disabled}
        ></input>
    )
}
