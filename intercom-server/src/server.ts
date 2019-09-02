import * as express from "express";
import * as https from "https";
import * as websocket from "websocket";
import * as uuid from "uuid/v4";
import * as fs from "fs";
import { InitialConnectResponse, MessageType, SocketMessage, InitialConnectMessage, RoomInfo, RoomListUpdate, BeginAudioTransfer, DEFAULT_PORT, EndAudioTransfer, PartnerDisconnectedAudio, PartnerConnectedAudio } from "../../intercom-client/src/shared";
import { Optional } from "java8script";

type OnMessageFunction = (data: websocket.IMessage) => void;
interface ConnectionInfo {
  id: string;
  roomName?: string;
  connection: websocket.connection;
  currentRecipientId?: string;
}

var connections: ConnectionInfo[] = [];

const onRequestHandler = (request: websocket.request) => {
  const con = request.accept(null, request.origin);
  const info: ConnectionInfo = {
    connection: con,
    id: uuid(),
  }
  connections.push(info);
  con.on("message", onMessageHandler(info))
  con.on("close", createCloseEvent(info.id))
  const initialResponse: InitialConnectMessage = {
    type: MessageType.S_2_C_InitialConnect,
    id: info.id,
  }
  con.sendUTF(JSON.stringify(initialResponse));
};

const onMessageHandler = (info: ConnectionInfo): OnMessageFunction => {
  return (data: websocket.IMessage) => {
    if (data.type === "utf8") {
      console.log(data);
      const socketMessage: SocketMessage = JSON.parse(data.utf8Data);
      if (socketMessage.type === MessageType.C_2_S_InitialConnectResponse) {
        handleInitialResponse(socketMessage as InitialConnectResponse);
      } else if (socketMessage.type === MessageType.C_2_S_BeginAudioTransfer) {
        handleAudioTransferStart(socketMessage as BeginAudioTransfer);
      } else if (socketMessage.type === MessageType.C_2_S_EndAudioTransfer) {
        handleAudioTransferEnd(socketMessage as EndAudioTransfer);
      }
    } else { //recieving buffered data
      if (info.currentRecipientId) {
        const receipientInfo: ConnectionInfo = connections.find(i => i.id === info.currentRecipientId);
        receipientInfo.connection.sendBytes(data.binaryData);
      }

    }
  }
}

//handles the initial connection handshake of a room, updates the rooms name and sends updates to 
//all others
const handleInitialResponse = (message: InitialConnectResponse) => {
  Optional.ofNullable(connections.find(c => c.id === message.id))
    .ifPresent(c => {
      c.roomName = message.name;
      sendConnectionUpdate();
    });
}

//changes the current recipient of the sender if they aren't already connected to someone else
//sends a connection message to the partner
const handleAudioTransferStart = (message: BeginAudioTransfer) => {
  connections.filter(c => c.id === message.senderId)
    .filter(sender => sender.currentRecipientId === undefined)
    .forEach(sender => {
      sender.currentRecipientId = message.recieverId;
      const messageToRecipient: PartnerConnectedAudio = {
        type: MessageType.S_2_C_PartnerSendingAudio,
        senderId: sender.id,
      };
      sendMessageToId(messageToRecipient, message.recieverId, "partner connect");
    });
}

//clears the current recipient of the sender, updates the recipient with a message
const handleAudioTransferEnd = (message: EndAudioTransfer) => {
  console.log("handleTransferEnd");
  connections.filter(c => c.id === message.senderId)
    .filter(sender => sender.currentRecipientId)
    .filter(senderWithRecip => senderWithRecip.currentRecipientId === message.recieverId)
    .forEach(sender => {
      sender.currentRecipientId = undefined;
      const messageToRecipient: PartnerDisconnectedAudio = {
        type: MessageType.S_2_C_PartnerEndingAudio,
        senderId: sender.id,
      };
      sendMessageToId(messageToRecipient, message.recieverId, "partner disconnect");
    })
}

//returns a function that removes a connection from the connection list
const createCloseEvent = (connectionID: string): (() => void) => {
  return () => {
    connections = connections.filter(info => info.id !== connectionID);
    console.log("removing");
    console.log(connections)
    sendConnectionUpdate();
  }
}

//sends the updated connection details list to all clients
const sendConnectionUpdate = () => {
  const latestRoomDetails: RoomInfo[] = connections.map(c => {
    return {
      roomName: c.roomName,
      id: c.id,
    }
  });
  console.log("roomUpdate");
  console.log(latestRoomDetails);
  const message: RoomListUpdate = {
    type: MessageType.S_2_C_RoomListUpdate,
    rooms: latestRoomDetails,
  };
  connections.forEach(info => {
    info.connection.sendUTF(JSON.stringify(message));
  })

}

//generic function to send a message to a client
const sendMessageToId = (message: SocketMessage, id: string, logMessage?: string) => {
  if (logMessage) {
    console.log(logMessage);
  }
  const connection: Optional<ConnectionInfo> = Optional.ofNullable(connections.find(c => c.id === id));
  connection.ifPresent(connection => {
    console.log(message);
    connection.connection.sendUTF(JSON.stringify(message));
  });

}


//actual app setup
const expressApp = express();
expressApp.use(express.static(__dirname + "/web"));
expressApp.get("/", (req, res) => res.sendFile(__dirname + "/index.html"))
const server = https.createServer({
  key: fs.readFileSync('./certs/server.key'),
  cert: fs.readFileSync('./certs/server.cert'),
}, expressApp);
const wss = new websocket.server({ httpServer: server });
wss.on("request", onRequestHandler);
server.listen(DEFAULT_PORT, () => {
  console.log(`Server started on port ${DEFAULT_PORT} :)`);
});