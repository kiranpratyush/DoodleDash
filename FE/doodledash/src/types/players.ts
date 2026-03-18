interface Player {
    playerId: string
    playerName: string
    playerPoints: number
    isHost: boolean
}
interface ChatMessage {
    id: string
    playerId?: string
    playerName?: string
    messageContent: string
    timestamp: number
}

interface RoomConfig {
    roomCode: string
    maxPlayers: number
    totalRounds: number
    drawTimeSeconds: number
}
export interface GameStore {
    currentPlayerId: string | null
    roomConfig: RoomConfig | null
    players: Record<string, Player>
    currentDrawId: string | null
    gamePhase: 'lobby' | 'wordSelection' | 'playing' | 'roundReveal' | 'gameEnd'
    playersWhoGuessed: string[]
    currentRoound: number
    wordChoices: string[]
    targetWordHint: string[]
    actualWord:
        | string
        | null /* if the current player is drawer or after roundReveal*/
    chatMessages: ChatMessage[]
}
export interface LocalInputs {
    playerName: string | null
    maxPlayers: number
    maxRounds: number
    drawTimeInSecond: number
    customWords: string[]
}
