import { ClientConfig } from "../shared";

export default class WebSocketManager {

    private config: ClientConfig;
    private roomName: string;
    private socketConnection: WebSocket;
    private isConnected: boolean;

    constructor(config: ClientConfig, roomName: string) {
        this.config = config;
        this.roomName = roomName;
        this.isConnected = false;
        this.socketConnection = new WebSocket(`ws://${config.serverHost}:${config.serverPort}`);
        this.socketConnection.onopen = () => this.isConnected = true;
        this.socketConnection.onopen = () => this.isConnected = false;
    }


}