interface Props {
  word: string;
  revealedIndices?: number[];
}

export function GuessWord({ word, revealedIndices = [] }: Props) {
  return (
    <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-sm self-center mb-4">
      {word.split('').map((char, index) => (
        <span
          key={index}
          className="w-8 h-10 flex items-center justify-center text-xl font-bold text-gray-800 border-b-2 border-gray-800"
        >
          {revealedIndices.includes(index) ? char.toUpperCase() : ''}
        </span>
      ))}
    </div>
  );
}
