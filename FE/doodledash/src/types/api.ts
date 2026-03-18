export type ApiResponse<T> =
    | { isSuccess: true; data: T }
    | { isSuccess: false; error: { error: true; errorMessage: string } }

export interface CreateGameRequest {
    playerName: string
    maxAllowedPlayers: number
    totalRounds: number
    drawTimeSeconds: number
    customWords: string[]
}
interface CreateGameResponseData {
    playerId: string
    roomCode: string
}
export type CreateGameResponse = ApiResponse<CreateGameResponseData>
