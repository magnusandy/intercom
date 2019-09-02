export const DEFAULT_PORT = 1337;

export enum MessageType {
    S_2_C_InitialConnect,
    C_2_S_InitialConnectResponse,
    S_2_C_RoomListUpdate,
    C_2_S_BeginAudioTransfer,
    S_2_C_PartnerSendingAudio,
    C_2_S_EndAudioTransfer,
    S_2_C_PartnerEndingAudio,
}

export interface RoomInfo {
    roomName?: string;
    id: string;
}

export interface SocketMessage {
    type: MessageType;
}

//after a client connects this message is pushed to the client that just connected, it contains their new ID
export interface InitialConnectMessage extends SocketMessage {
    type: MessageType.S_2_C_InitialConnect;
    id: string;
}

//After recieving the InitialConnectMessage, a client will respond with this message, containing their name details
export interface InitialConnectResponse extends SocketMessage {
    type: MessageType.C_2_S_InitialConnectResponse;
    id: string,
    name: string;
}

//after a connected client completes the handshake by sending an InitalConnectResponse, a list update is sent out to all connected clients
export interface RoomListUpdate extends SocketMessage {
    type: MessageType.S_2_C_RoomListUpdate;
    rooms: RoomInfo[];
}

//the start button is pressed for another room with a given id, recieverId
export interface BeginAudioTransfer extends SocketMessage {
    type: MessageType.C_2_S_BeginAudioTransfer;
    senderId: string;
    recieverId: string;
}

//after one client initializes an audio transfer with a BeginAudioTransferMessage, this message will be send to the reciever
export interface PartnerConnectedAudio extends SocketMessage {
    type: MessageType.S_2_C_PartnerSendingAudio;
    senderId: string; 
}

//the person who initialized an audio send has ended the transfer
export interface EndAudioTransfer extends SocketMessage {
    type: MessageType.C_2_S_EndAudioTransfer;
    senderId: string;
    recieverId: string; 
}

//the sender of an audio transfer cancels the call with EndAudioTransfer, this will be send to the reciever to end the call
export interface PartnerDisconnectedAudio extends SocketMessage {
    type: MessageType.S_2_C_PartnerEndingAudio;
    senderId: string; 
}

export interface ClientConfig {
    serverHost: string,
    serverPort: number
}