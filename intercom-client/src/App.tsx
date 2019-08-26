import React from 'react';
import { InitialConnectResponse, MessageType, SocketMessage, InitialConnectMessage, ClientConfig, RoomListUpdate, RoomInfo, BeginAudioTransfer } from "./shared";

var recordedAudio: Float32Array[] = [];
var context: AudioContext;
var processor: ScriptProcessorNode;


const handleSuccess = (stream: MediaStream) => {
  context = new AudioContext();
  const source = context.createMediaStreamSource(stream);
  processor = context.createScriptProcessor(16384, 1, 1);

  source.connect(processor);
  processor.connect(context.destination);
};

const playSingle = (arr: Float32Array) => {
  const buffer = context.createBuffer(1, 16384, context.sampleRate);
  buffer.copyToChannel(arr, 0);
  const source = context.createBufferSource()
  source.buffer = buffer;
  source.connect(context.destination);
  source.start(0);
}

const play = (): void => {
  console.log(recordedAudio.length)
  //copy the current recurded data 
  const copiedData = recordedAudio.map(arr => new Float32Array(arr));
  recordedAudio = [];
  const testBuff = context.createBuffer(1, 16384000, 44100)
  copiedData.forEach((array, i) => {
    const channelArr = testBuff.getChannelData(0)
    const offset = i * 16384;
    array.forEach((flt, y) => {
      channelArr[offset + y] = flt;
    })
  })
  const source = context.createBufferSource();
  source.buffer = testBuff;
  source.connect(context.destination);
  source.start(0);
}

const connectToSocket = () => {

}

interface Props {
  roomName: string;
  config: ClientConfig;
}

interface State {
  isConnected: boolean;
  id?: string;
  rooms: RoomInfo[];
}

class App extends React.Component<Props, State> {

  private socket?: WebSocket;

  constructor(props: Props) {
    super(props);
    this.socket = undefined;
    this.state = {
      isConnected: false,
      id: undefined,
      rooms: []
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
    console.log(message);
    if(message.data instanceof Blob) {
      //handle as audio message
      const blobData: any = message.data;//typing doesnt seem to work
      blobData.arrayBuffer()//returns Promise<ArrayBuffer>
      .then((arrayBuffer: ArrayBuffer) => {
        playSingle(new Float32Array(arrayBuffer));
      })

    } else {
      //handle as a json message
      const parsed: SocketMessage = JSON.parse(message.data);
      if (parsed.type === MessageType.S_2_C_InitialConnect) {
        const idMessage: InitialConnectMessage = parsed as InitialConnectMessage;
        this.handleIdMessage(idMessage);
      } else if (parsed.type === MessageType.S_2_C_RoomListUpdate) {
        this.handleRoomUpdateMessage(parsed as RoomListUpdate);
      }
    }
  }

  handleIdMessage = (message: InitialConnectMessage) => {
    console.log("my id is: " + message.id);
    if (this.socket) {
      this.setState({ id: message.id })
      const response: InitialConnectResponse = {
        type: MessageType.C_2_S_InitialConnectResponse,
        name: this.props.roomName,
        id: message.id
      };
      this.socket.send(JSON.stringify(response))
    } else {
      console.log("socket not available when trying to handle id message");
    }
  }

  handleRoomUpdateMessage = (message: RoomListUpdate) => {
    if (this.socket) {
      this.setState({ rooms: message.rooms });
    } else {
      console.log("socket not available handling room update")
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
      if(this.socket && this.state.id) {
        const startMessage: BeginAudioTransfer = {
          type: MessageType.C_2_S_BeginAudioTransfer,
          id: this.state.id,
          recieverId: otherId,
        }
        this.socket.send(JSON.stringify(startMessage));
      } else {
        console.log("problem sending start transfer message")
      }
      processor.onaudioprocess = (event: AudioProcessingEvent) => {
        console.log("starting to process");
        const data: Float32Array = event.inputBuffer.getChannelData(0);
        if(this.socket) {
          this.socket.send(data)
        } else {
          console.log("error sending audio data");
        }
      }
    }
  }

  stopSendToOther = (otherId: string): (() => void) => {
    return () => {
      console.log("stoping to process");
      processor.onaudioprocess = () => {
      }
    }
  }

  render = () => {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(handleSuccess);
    return (
      <div className="App">
        <h1>Your Room: {this.props.roomName}</h1>
        <h1>Other Rooms:</h1>
        <table>
          <thead>
            <tr>
              <th>Rooms</th>
              <th>Controls</th>
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
                </tr>);
            })}
            </tbody>
        </table>
        <button onClick={play}>play</button>
      </div>
    );
  }
}

export default App;
