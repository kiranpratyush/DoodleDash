import { create } from 'zustand'
import type { GameStore } from '../types/players'

interface GameStoreWithActions extends GameStore {
    setRoomDetails: (
        roomCode: string,
        playerId: string,
        playerName: string
    ) => void
}

export const useGameStore = create<GameStoreWithActions>((set) => ({
    currentPlayerId: null,
    roomConfig: null,
    players: {},
    currentDrawId: null,
    gamePhase: 'lobby',
    playersWhoGuessed: [],
    currentRoound: 0,
    wordChoices: [],
    targetWordHint: [],
    actualWord: null,
    chatMessages: [],

    setRoomDetails: (roomCode: string, playerId: string, playerName: string) =>
        set({
            currentPlayerId: playerId,
            roomConfig: {
                roomCode,
                maxPlayers: 0,
                totalRounds: 0,
                drawTimeSeconds: 0,
            },
            players: {
                [playerId]: {
                    playerId,
                    playerName,
                    playerPoints: 0,
                    isHost: true,
                },
            },
        }),
}))
