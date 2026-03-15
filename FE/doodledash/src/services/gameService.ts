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

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(gameRequest),
            signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
            const errorData = await response.json().catch(() => null)
            if (errorData?.errorMessage) {
                return {
                    isSuccess: false,
                    error: {
                        error: true,
                        errorMessage: errorData.errorMessage,
                    },
                }
            }
            return {
                isSuccess: false,
                error: {
                    error: true,
                    errorMessage: 'Something went wrong',
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
        clearTimeout(timeoutId)
        return handleCommonError(error)
    }
}
