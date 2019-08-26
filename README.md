Basic intercom system using React and web audio apis on the FE and a web socket server to handle connections.

in order to run you need to supply
1. a config.secret.js file in the intercom-client/src/socket folder with the following contents

```
export const config = {
    serverHost: "<your web server host>",
}
```

2. a certs folder with a server.cert and a server.key file in the intercom-server directory

run the project from the server directory by running `yarn startFull`

this will start the websocket server on port 1337 as well as serve the website files on a https server.