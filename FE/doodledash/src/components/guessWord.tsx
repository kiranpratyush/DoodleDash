import { useGameStore } from '../store/gameStore'

export function GuessWord() {
    const currentWord = useGameStore((state) => state.currentWord)
    const wordHint = useGameStore((state) => state.currentWordHint)

    const HintComponent = () => {
        if (wordHint && !currentWord) {
            const array = new Array(wordHint.length).fill('')
            for (const index of wordHint.revealedIndices) {
                array[index.index] = index.character
            }
            return array.map((element) => <span>{element || '_'}</span>)
        }
    }

    return (
        <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-sm self-center mb-4">
            {currentWord && <div>{currentWord}</div>}
            <HintComponent />
        </div>
    )
}
