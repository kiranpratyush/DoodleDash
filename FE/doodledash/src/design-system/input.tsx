interface DoodleDashInputProps {
    placeHolder: string
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
    type: string
    id?: string
    value: string | null
}

export function DoodleDashInput({
    placeHolder,
    onChange,
    type,
    id,
    value,
}: DoodleDashInputProps) {
    return (
        <input
            className="p-2 border-2 border-emerald-400 text-lg h-8 rounded-sm outline-emerald-600 inline-block w-full"
            type={type}
            placeholder={placeHolder}
            onChange={onChange}
            id={id}
            value={value || ''}
        ></input>
    )
}
