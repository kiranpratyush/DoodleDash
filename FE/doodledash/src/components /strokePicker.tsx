interface Props {
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
}

const STROKE_OPTIONS = [
  { size: 3, label: 'S' },
  { size: 8, label: 'M' },
  { size: 15, label: 'L' },
];

export function StrokePicker(prop: Props) {
  return (
    <div className="flex items-center gap-2">
      {STROKE_OPTIONS.map((option) => (
        <button
          key={option.size}
          onClick={() => prop.setStrokeWidth(option.size)}
          className={`rounded-[50%] w-[20px] h-[20px] bg-black font-bold border-2 ${prop.strokeWidth === option.size
            ? 'border-gray-400'
            : 'border-gray-300'
            }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
