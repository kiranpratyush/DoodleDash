import { useGameStore } from '../store/gameStore'

interface Props {
    currentWord: string
}

const HintComponent = ({ currentWord }: Props) => {
    const wordHint = useGameStore((state) => state.currentWordHint)
    if (wordHint && !currentWord) {
        const array = new Array(wordHint.length).fill('')
        for (const index of wordHint.revealedIndices) {
            array[index.index] = index.character
        }
        return array.map((element) => <span>{element || '_'}</span>)
    }
}
export function GuessWord() {
    const currentWord = useGameStore((state) => state.currentWord)
    return (
        <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-sm self-center mb-4">
            {currentWord && <div>{currentWord}</div>}
            <HintComponent currentWord={currentWord || ''} />
        </div>
    )
}
