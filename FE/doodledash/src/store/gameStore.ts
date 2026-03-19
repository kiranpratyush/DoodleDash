import { create } from 'zustand'
import {
    type ChatMessage,
    type GameSnapShotResponse,
    type GameStore,
    type RoomSnapshotResponse,
} from '../types'

interface GameStoreWithActions extends GameStore {
    applyRoomSnapshot: (snapshot: RoomSnapshotResponse) => void
    addChatMessage: (message: ChatMessage) => void
    upsertPlayer: (player: GameStore['currentPlayer']) => void
    removePlayer: (playerId: string) => void
    resetGame: () => void
    setGameStore: (storeUpdates: Partial<GameStore>) => void
}

const defaultGameStore: GameStore = {
    roomCode: '',
    drawTimeSeconds: 0,
    players: [],
    gameStatus: 'Lobby',
    currentRound: 0,
    totalRounds: 0,
    chatMessages: [],
    wordSelectionSeconds: 0,
    drawData: [],
    currentWordOptions: [],
}

const mapGameSnapshotToState = (
    snapshot: GameSnapShotResponse,
    fallback: GameStore
): Partial<GameStore> => ({
    gameStatus: snapshot.gameStatus ?? fallback.gameStatus,
    lobbyMessage: snapshot.lobbyMessage ?? fallback.lobbyMessage,
    currentRound: snapshot.roundNumber ?? fallback.currentRound,
    totalRounds: snapshot.totalRounds ?? fallback.totalRounds,
    drawTimeSeconds: snapshot.drawTimeSeconds ?? fallback.drawTimeSeconds,
    chatMessages: snapshot.chatMessages ?? fallback.chatMessages,
    players: snapshot.players ?? fallback.players,
    activePlayer: snapshot.player ?? fallback.activePlayer,
    currentWordHint: snapshot.currentWordHint ?? fallback.currentWordHint,
    roundEndTime: snapshot.roundEndTime ?? fallback.roundEndTime,
    drawData: snapshot.drawData ?? fallback.drawData,
    selectionEndTime: snapshot.selectionEndTime ?? fallback.selectionEndTime,
    lastRoundResult: snapshot.lastRoundResult ?? fallback.lastRoundResult,
    finalResult: snapshot.finalResult ?? fallback.finalResult,
})

export const useGameStore = create<GameStoreWithActions>((set) => ({
    ...defaultGameStore,
    applyRoomSnapshot: (snapshot: RoomSnapshotResponse) =>
        set((state) => {
            if (!snapshot.success) {
                return state
            }

            const nextState: Partial<GameStore> = {
                currentPlayer: snapshot.player ?? state.currentPlayer,
            }

            if (snapshot.snapShotResponse) {
                return {
                    ...state,
                    ...nextState,
                    ...mapGameSnapshotToState(snapshot.snapShotResponse, state),
                }
            }

            return { ...state, ...nextState }
        }),

    setGameStore: (storeUpdate: Partial<GameStore>) => {
        set((state) => {
            return { ...state, ...storeUpdate }
        })
    },
    addChatMessage: (message: ChatMessage) =>
        set((state) => ({
            chatMessages: [...state.chatMessages, message],
        })),
    upsertPlayer: (player) =>
        set((state) => {
            if (!player) {
                return state
            }
            const existingIndex = state.players.findIndex(
                (p) => p.id === player.id
            )
            if (existingIndex === -1) {
                return { players: [...state.players, player] }
            }

            const updatedPlayers = [...state.players]
            updatedPlayers[existingIndex] = player
            return { players: updatedPlayers }
        }),
    removePlayer: (playerId) =>
        set((state) => ({
            players: state.players.filter((player) => player.id !== playerId),
        })),

    resetGame: () => set(() => defaultGameStore),
}))
