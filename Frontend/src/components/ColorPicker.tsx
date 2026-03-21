export interface Props {
    activeColor: string
    setActiveColor: (color: string) => void
}

const COLORS = [
    '#000000',
    '#FFFFFF',
    '#FF0000',
    '#0000FF',
    '#800080',
    '#8B4513',
]

export function ColorPicker(prop: Props) {
    return (
        <div className="flex gap-2 p-2 rounded-lg self-center">
            {COLORS.map((color) => (
                <button
                    key={color}
                    onClick={() => prop.setActiveColor(color)}
                    className={`w-6 h-6 rounded-full border-2 ${
                        prop.activeColor === color
                            ? 'border-gray-400 ring-2 ring-gray-300'
                            : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                />
            ))}
        </div>
    )
}
