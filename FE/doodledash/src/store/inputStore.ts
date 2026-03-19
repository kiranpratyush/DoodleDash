import { create } from 'zustand'
import { type LocalInputs } from '../../types'
type currentScreen = 'HOME' | 'GAMECONFIG' | 'ROOM'

export interface InputStore {
    localInputs: LocalInputs
    currentScreen: currentScreen
    setPlayerName: (name: string) => void
    setMaxPlayers: (max: number) => void
    setMaxRounds: (rounds: number) => void
    setDrawTime: (seconds: number) => void
    setCustomWords: (words: string) => void
    addCustomWord: (word: string) => void
    removeCustomWord: (index: number) => void
    resetInputs: () => void
    setCurrentScreen: (screen: currentScreen) => void
}

const initialInputs: LocalInputs = {
    playerName: null,
    maxPlayers: 2,
    maxRounds: 1,
    drawTimeInSecond: 10,
    customWords: [],
}

export const useLocalInputs = create<InputStore>((set) => ({
    localInputs: initialInputs,

    currentScreen: 'HOME',

    setPlayerName: (name) =>
        set((state) => ({
            localInputs: { ...state.localInputs, playerName: name },
        })),

    setMaxPlayers: (max) =>
        set((state) => ({
            localInputs: { ...state.localInputs, maxPlayers: max },
        })),

    setMaxRounds: (rounds) =>
        set((state) => ({
            localInputs: { ...state.localInputs, maxRounds: rounds },
        })),

    setDrawTime: (seconds) =>
        set((state) => ({
            localInputs: { ...state.localInputs, drawTimeInSecond: seconds },
        })),

    setCustomWords: (wordsString: string) => {
        set((state) => ({
            localInputs: {
                ...state.localInputs,
                customWords: wordsString
                    .split(',')
                    .map((word) => word.trim())
                    .filter((word) => word !== ''),
            },
        }))
    },

    addCustomWord: (word) =>
        set((state) => ({
            localInputs: {
                ...state.localInputs,
                customWords: [...state.localInputs.customWords, word],
            },
        })),

    removeCustomWord: (index) =>
        set((state) => ({
            localInputs: {
                ...state.localInputs,
                customWords: state.localInputs.customWords.filter(
                    (_, i) => i !== index
                ),
            },
        })),

    resetInputs: () => set({ localInputs: initialInputs }),

    setCurrentScreen: (screenName: InputStore['currentScreen']) =>
        set((state) => ({
            localInputs: { ...state.localInputs },
            currentScreen: screenName,
        })),
}))
