import * as signalR from '@microsoft/signalr';
import { type DataPoint } from '../types/pos';

class DrawingHubService {
  private connection: signalR.HubConnection;

  constructor() {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${import.meta.env.PUBLIC_HUB_URL}/doodleDash`)  // Changed to match backend hub endpoint
      .withAutomaticReconnect([0, 2000, 5000, 10000, 15000, 30000]) // Retry pattern with increasing delays
      .build();

    // Set up reconnection handling
    this.connection.onreconnecting((error) => {
      console.warn("Connection lost, reconnecting...", error);
    });

    this.connection.onreconnected(() => {
      console.log("Reconnected to hub");
    });
  }

  async start() {
    if (this.connection.state === signalR.HubConnectionState.Disconnected) {
      try {
        await this.connection.start();
        console.log("Connected to DoodleDash hub");
      } catch (err) {
        console.error("Error connecting to hub:", err);
        // Retry connection after a delay
        setTimeout(() => this.start(), 5000);
      }
    }
  }

  async stop() {
    await this.connection.stop();
  }

  async sendDataPoints(point: DataPoint) {
    // Changed method name to match backend's Draw method
    await this.connection.invoke('DrawBroadCast', point);
  }

  onReceiveDataPoints(callback: (point: DataPoint) => void) {
    // Changed event name to match backend's ReceiveDraw event
    this.connection.on('ReceiveDraw', callback);
  }
}

export const drawingHubService = new DrawingHubService();
export type { DataPoint };
