import { create } from 'zustand'
import {
    type ChatMessage,
    type GameSnapShotResponse,
    type GameStore,
    type RoomOverlay,
    type RoomSnapshotResponse,
} from '../types'

interface GameStoreWithActions extends GameStore {
    applyRoomSnapshot: (snapshot: RoomSnapshotResponse) => void
    addChatMessage: (message: ChatMessage) => void
    upsertPlayer: (player: GameStore['currentPlayer']) => void
    removePlayer: (playerId: string) => void
    resetGame: () => void
    setGameStore: (storeUpdates: Partial<GameStore>) => void
    setOverlay: (overlay: RoomOverlay) => void
    resetOverlay: () => void
    incrementCanvasClearSignal: () => void
}

const defaultGameStore: GameStore = {
    roomCode: '',
    pendingStartGame: false,
    drawTimeSeconds: 0,
    players: [],
    gameStatus: 'Lobby',
    currentRound: 0,
    totalRounds: 0,
    chatMessages: [],
    wordSelectionSeconds: 0,
    drawData: [],
    currentWordOptions: [],
    overlay: { type: 'default' },
    canvasClearSignal: 0,
}

const mapGameSnapshotToState = (
    snapshot: GameSnapShotResponse,
    fallback: GameStore
): Partial<GameStore> => ({
    gameStatus: snapshot.gameStatus ?? fallback.gameStatus,
    hostId: snapshot.hostId ?? fallback.hostId,
    lobbyMessage: snapshot.lobbyMessage ?? fallback.lobbyMessage,
    currentRound: snapshot.roundNumber ?? fallback.currentRound,
    totalRounds: snapshot.totalRounds ?? fallback.totalRounds,
    drawTimeSeconds: snapshot.drawTimeSeconds ?? fallback.drawTimeSeconds,
    chatMessages: snapshot.chatMessages ?? fallback.chatMessages,
    players: snapshot.players ?? fallback.players,
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
    setOverlay: (overlay: RoomOverlay) => {
        set(() => ({ overlay }))
    },
    resetOverlay: () => {
        set(() => ({ overlay: { type: 'default' } }))
    },
    incrementCanvasClearSignal: () => {
        set((state) => ({ canvasClearSignal: state.canvasClearSignal + 1 }))
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
