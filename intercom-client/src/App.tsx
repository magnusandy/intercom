import React from 'react';
import { InitialConnectResponse, MessageType, SocketMessage, InitialConnectMessage, ClientConfig, RoomListUpdate, RoomInfo, BeginAudioTransfer, PartnerConnectedAudio, PartnerDisconnectedAudio, EndAudioTransfer } from "./shared";
import { AudioStack } from './socket/audioStack';

var audio: AudioStack;

interface Props {
  roomName: string;
  config: ClientConfig;
}

interface State {
  isConnected: boolean;
  id?: string;
  rooms: RoomInfo[];
  connectedRoomId?: string;
}

const handleMicConnection = (stream: MediaStream) => {
  if (!audio) {
    audio = new AudioStack(stream);
  }
};

class App extends React.Component<Props, State> {

  private socket?: WebSocket;

  constructor(props: Props) {
    super(props);
    this.socket = undefined;
    this.state = {
      isConnected: false,
      id: undefined,
      rooms: [],
      connectedRoomId: undefined,
    }
  }

  onOpen = () => {
    console.log("OPEN");
    this.setState({ isConnected: true });
  }

  onClose = () => {
    console.log("CLOSE");
    this.setState({ isConnected: false });
  }

  onMessage = (message: MessageEvent) => {
    //console.log(message);
    if (message.data instanceof Blob) {
      const blobData: any = message.data;//typing doesnt seem to work
      blobData.arrayBuffer()//returns Promise<ArrayBuffer>
        .then((arrayBuffer: ArrayBuffer) => {
          audio.add(arrayBuffer);
        })

    } else {
      //handle as a json message
      const parsed: SocketMessage = JSON.parse(message.data);
      if (parsed.type === MessageType.S_2_C_InitialConnect) {
        console.log("IdMessage")
        this.handleIdMessage(parsed as InitialConnectMessage);
      } else if (parsed.type === MessageType.S_2_C_RoomListUpdate) {
        console.log("RoomListUpdate")
        this.handleRoomUpdateMessage(parsed as RoomListUpdate);
      } else if (parsed.type === MessageType.S_2_C_PartnerSendingAudio) {
        console.log("PartnerSending")
        this.handleAudioRecievingStarting(parsed as PartnerConnectedAudio);
      } else if (parsed.type === MessageType.S_2_C_PartnerEndingAudio) {
        console.log("PartnerDisconnecting")
        this.handleAudioRecivingDisconnected(parsed as PartnerDisconnectedAudio);
      }
    }
  }

  handleIdMessage = (message: InitialConnectMessage) => {
    this.setState({ id: message.id })
    const response: InitialConnectResponse = {
      type: MessageType.C_2_S_InitialConnectResponse,
      name: this.props.roomName,
      id: message.id
    };
    this.sendSocketMessage(response);
  }

  handleRoomUpdateMessage = (message: RoomListUpdate) => {
    this.setState({ rooms: message.rooms });
  }

  handleAudioRecievingStarting = (message: PartnerConnectedAudio) => {
    if (!audio.isStarted() && !this.state.connectedRoomId) {
      console.log('handlineAudioRecieveStart')
      console.log(audio.isStarted())
      audio.start();
      console.log(audio.isStarted())
      this.setState({ connectedRoomId: message.senderId });
    }
  }

  handleAudioRecivingDisconnected = (message: PartnerDisconnectedAudio) => {
    console.log(audio.isStarted());
    console.log(this.state);
    if (audio.isStarted() && this.state.connectedRoomId) {
      console.log('handlingAudioReiceevend')
      audio.stop();
      this.setState({ connectedRoomId: undefined });
    }
  }

  componentDidMount = () => {
    this.socket = new WebSocket(`wss://${this.props.config.serverHost}:${this.props.config.serverPort}`);
    this.socket.onopen = this.onOpen;
    this.socket.onclose = this.onClose;
    this.socket.onmessage = this.onMessage;
  }

  sendToOther = (otherId: string): (() => void) => {
    return () => {
      if (this.state.id) {
        this.setState({connectedRoomId: otherId});
        const startMessage: BeginAudioTransfer = {
          type: MessageType.C_2_S_BeginAudioTransfer,
          senderId: this.state.id,
          recieverId: otherId,
        }
        this.sendSocketMessage(startMessage);

        const func = (event: AudioProcessingEvent) => {
          const data: Float32Array = event.inputBuffer.getChannelData(0);
          if (this.socket) {
            this.socket.send(data)
          } else {
            console.log("error sending audio data");
          }
        }
        audio.attachMicReadingProcessor(func);
      }
    }
  }

  stopSendToOther = (otherId: string): (() => void) => {
    return () => {
      audio.clearMicReadingProcessor();
      this.setState({connectedRoomId: undefined});
      if (this.state.id && this.state.connectedRoomId === otherId) {
        const messageToEnd: EndAudioTransfer = {
          type: MessageType.C_2_S_EndAudioTransfer,
          senderId: this.state.id,
          recieverId: otherId
        };
        this.sendSocketMessage(messageToEnd);
      }
    }
  }

  sendSocketMessage = (message: SocketMessage) => {
    if (this.socket) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.log("socket not available when sending message" + message);
    }
  }

  render = () => {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(handleMicConnection);
    return (
      <div className="App">
        <h1>Your Room: {this.props.roomName}</h1>
        <h1>Other Rooms:</h1>
        <table>
          <thead>
            <tr>
              <th>Rooms</th>
              <th>Controls</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {this.state.rooms
              .filter(r => r.roomName)
              .filter(r => r.id !== this.state.id)
              .map(r => {
                return (
                  <tr key={r.id}>
                    <td><p>{r.roomName}</p></td>
                    <td>
                      <button onClick={this.sendToOther(r.id)}>Send</button>
                      <button onClick={this.stopSendToOther(r.id)}>Stop</button>
                    </td>
                    <td>{this.state.connectedRoomId && this.state.connectedRoomId === r.id ?
                        <p> Connected </p> : null}</td>
                  </tr>);
              })}
          </tbody>
        </table>
      </div>
    );
  }
}

export default App;
