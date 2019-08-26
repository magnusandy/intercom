export const DEFAULT_PORT = 1337;

export enum MessageType {
    S_2_C_InitialConnect,
    C_2_S_InitialConnectResponse,
    S_2_C_RoomListUpdate,
    C_2_S_BeginAudioTransfer,
}

export interface RoomInfo {
    roomName?: string;
    id: string;
}

export interface SocketMessage {
    type: MessageType;
}

export interface InitialConnectMessage extends SocketMessage {
    type: MessageType.S_2_C_InitialConnect;
    id: string;
}

export interface InitialConnectResponse extends SocketMessage {
    type: MessageType.C_2_S_InitialConnectResponse;
    id: string,
    name: string;
}

export interface RoomListUpdate extends SocketMessage {
    type: MessageType.S_2_C_RoomListUpdate;
    rooms: RoomInfo[];
}

export interface BeginAudioTransfer extends SocketMessage {
    type: MessageType.C_2_S_BeginAudioTransfer;
    id: string;
    recieverId: string;
}

export interface ClientConfig {
    serverHost: string,
    serverPort: number
}