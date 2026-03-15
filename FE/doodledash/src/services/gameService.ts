import { type CreateGameRequest, type CreateGameResponse } from '../types/api'

function handleCommonError(error: unknown): CreateGameResponse {
    if (error instanceof Error && error.name === 'AbortError') {
        return {
            isSuccess: false,
            error: {
                error: true,
                errorMessage: 'Request timed out',
            },
        }
    }

    return {
        isSuccess: false,
        error: {
            error: true,
            errorMessage: 'Network error occurred',
        },
    }
}

export async function startGame(
    gameRequest: CreateGameRequest
): Promise<CreateGameResponse> {
    const url = `${import.meta.env.PUBLIC_BASE_URL}/${import.meta.env.PUBLIC_ROOM_ENDPOINT}`

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(gameRequest),
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => null)
            return {
                isSuccess: false,
                error: {
                    error: true,
                    errorMessage:
                        errorData.errorMessage || 'Something went wrong',
                },
            }
        }

        const data = await response.json()
        return {
            isSuccess: true,
            data: {
                playerId: data.playerId,
                roomCode: data.roomCode,
            },
        }
    } catch (error) {
        return handleCommonError(error)
    }
}
