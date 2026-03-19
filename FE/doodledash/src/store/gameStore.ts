import { create } from 'zustand'
import {
    type ChatMessage,
    type GameSnapShotResponse,
    type GameStatus,
    type GameStore,
    type Player,
    type RoomSnapshotResponse,
} from '../../types'

interface GameStoreWithActions extends GameStore {
    applyRoomSnapshot: (snapshot: RoomSnapshotResponse) => void
    addChatMessage: (message: ChatMessage) => void
    resetGame: () => void
}

const defaultGameStore: GameStore = {
    roomCode: '',
    currentPlayerId: '',
    currentPlayerName: '',
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
                currentPlayerId: snapshot.player?.id ?? state.currentPlayerId,
                currentPlayerName:
                    snapshot.player?.name ?? state.currentPlayerName,
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

    addChatMessage: (message: ChatMessage) =>
        set((state) => ({
            chatMessages: [...state.chatMessages, message],
        })),

    resetGame: () => set(() => defaultGameStore),
}))
