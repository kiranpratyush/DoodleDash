interface DoodleDashInputProps {
    placeHolder: string
    onInput: (event: React.InputEvent) => void
    type: string
    id?: string
}

export function DoodleDashInput({
    placeHolder,
    onInput,
    type,
    id,
}: DoodleDashInputProps) {
    return (
        <input
            className="p-2 border-2 border-emerald-400 text-lg h-8 rounded-sm outline-emerald-600 inline-block w-full"
            type={type}
            placeholder={placeHolder}
            onInput={onInput}
            id={id}
        ></input>
    )
}
