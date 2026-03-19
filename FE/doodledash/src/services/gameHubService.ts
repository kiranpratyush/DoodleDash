import * as signalR from '@microsoft/signalr'
import { type DrawPoint } from '../types'
import { type RoomSnapshotResponse } from '../types'

class GameHubService {
    private connection: signalR.HubConnection

    constructor() {
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(`${import.meta.env.PUBLIC_HUB_URL}/doodleDash`) // Changed to match backend hub endpoint
            .withAutomaticReconnect([0, 2000, 5000, 10000, 15000, 30000]) // Retry pattern with increasing delays
            .build()

        // Set up reconnection handling
        this.connection.onreconnecting((error) => {
            console.warn('Connection lost, reconnecting...', error)
        })

        this.connection.onreconnected(() => {
            console.log('Reconnected to hub')
        })
    }

    async start() {
        if (this.connection.state === signalR.HubConnectionState.Disconnected) {
            try {
                await this.connection.start()
                console.log('Connected to DoodleDash hub')
            } catch (err) {
                console.error('Error connecting to hub:', err)
                // Retry connection after a delay
                setTimeout(() => this.start(), 5000)
            }
        }
    }

    async stop() {
        await this.connection.stop()
    }

    async joinRoom(
        roomCode: string,
        playerName: string,
        playerId?: string
    ): Promise<RoomSnapshotResponse> {
        await this.start()
        let response: RoomSnapshotResponse = {
            success: false,
        }
        try {
            response = await this.connection.invoke<RoomSnapshotResponse>(
                'JoinRoom',
                roomCode,
                playerName,
                playerId
            )
        } catch (error) {
            console.log('error', error)
            if (error instanceof Error) {
                response.errorMessage = error.message
            } else {
                response.errorMessage = 'Unknown error'
            }
        }
        return response
    }

    async sendDataPoints(point: DrawPoint) {
        await this.connection.invoke(
            'OnDrawData',
            point.roomCode,
            point.playerId,
            [point.x0, point.y0, point.x1, point.y1]
        )
    }

    async startGame(roomCode: string) {
        await this.connection.invoke('StartGame', roomCode)
    }

    OnDrawData(callback: (point: DrawPoint) => void) {
        const innerCallback = (args: number[]) => {
            const point: DrawPoint = {
                color: 'red',
                playerId: 'random',
                roomCode: 'xyz',
                x0: args[0],
                y0: args[1],
                x1: args[2],
                y1: args[3],
                brushSize: 2,
            }
            callback(point)
        }

        this.connection.on('OnDrawData', innerCallback)

        return () => {
            this.connection.off('OnDrawData', innerCallback)
        }
    }

    onPlayerJoined(callback: (player: RoomSnapshotResponse['player']) => void) {
        const innerCallback = (player: RoomSnapshotResponse['player']) => {
            callback(player)
        }

        this.connection.on('PlayerJoined', innerCallback)

        return () => {
            this.connection.off('PlayerJoined', innerCallback)
        }
    }

    onPlayerLeft(callback: (player: RoomSnapshotResponse['player']) => void) {
        const innerCallback = (player: RoomSnapshotResponse['player']) => {
            callback(player)
        }

        this.connection.on('PlayerLeft', innerCallback)

        return () => {
            this.connection.off('PlayerLeft', innerCallback)
        }
    }
}

export const gameHubService = new GameHubService()
