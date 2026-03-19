export interface LocalInputs {
    playerName: string | null
    maxPlayers: number
    maxRounds: number
    drawTimeInSecond: number
    customWords: string[]
}

export interface Pos {
    x: number
    y: number
}
export interface DataPoint {
    playerId: string
    x0: number
    y0: number
    x1: number
    y1: number
    color: string
    brushSize: number
}

export type ApiResponse<T> =
    | { isSuccess: true; data: T }
    | { isSuccess: false; error: { error: true; errorMessage: string } }

export interface CreateRoomRequest {
    playerName: string
    maxAllowedPlayers: number
    totalRounds: number
    drawTimeSeconds: number
    customWords: string[]
}
interface CreateRoomResponsePayload {
    playerId: string
    playerName: string
    roomCode: string
}
export type CreateRoomResponse = ApiResponse<CreateRoomResponsePayload>

export type GameStatus =
    | 'Lobby'
    | 'SelectingWord'
    | 'Drawing'
    | 'RoundEnded'
    | 'GameEnded'

export type MessageType = 'User' | 'System'

export interface Response {
    success: boolean
    errorCode?: string
    errorMessage?: string
}

export interface ChatMessage {
    playerId: string
    playerName: string
    message: string
    messageType: MessageType
}

export interface Player {
    name: string
    id: string
    connectionId: string
    score: number
}

export interface Hint {
    index: number
    character: string
}

export interface WordHint {
    length: number
    revealedIndices: Hint[]
}

export interface RoundOverResponse extends Response {
    players: Player[]
    correctWord: string
    roundNumber: number
}
export interface GameOverResponse extends Response {
    finalScores: Player[]
    winner?: Player
}

export interface GameSnapShotResponse {
    gameStatus: GameStatus
    lobbyMessage?: string
    roundNumber: number
    totalRounds: number
    drawTimeSeconds: number
    chatMessages: ChatMessage[]
    players: Player[]
    player?: Player
    currentWordHint?: WordHint
    roundEndTime?: string
    drawData: number[][]
    selectionEndTime?: string
    lastRoundResult?: RoundOverResponse
    finalResult?: GameOverResponse
}

export interface RoomSnapshotResponse extends Response {
    player?: Player
    snapShotResponse?: GameSnapShotResponse
}

export interface GameStore {
    roomCode: string
    currentPlayerId: string
    currentPlayerName: string
    maxPlayerCount?: number
    drawTimeSeconds: number
    wordSelectionEndTime?: string
    currentPlayer?: Player
    players: Player[]
    gameStatus: GameStatus
    lobbyMessage?: string
    currentRound: number
    totalRounds: number
    wordSelectionSeconds: number
    chatMessages: ChatMessage[]
    activePlayer?: Player
    currentWordHint?: WordHint
    roundEndTime?: string
    selectionEndTime?: string
    drawData: number[][]
    currentWord?: string
    currentWordOptions: string[]
    lastRoundResult?: RoundOverResponse
    finalResult?: GameOverResponse
}
