# multiserver-chat

Multiserver Chat is an external back channel chat extension for StarMash.

## Client side usage

Configure and then place ws-chat-bridge.js on the web. Direct StarMash to load this file as an extension.

In js console try:

    bouncerServer = "wss://server:port"
    setup()

## Server side usage

### Prerequisites

1. `websocketd` provides CGI but for websockets.
2. `sic` provides the IRC connection. Configure the default server and change prefix character to `/`.
3. `miniircd` or any IRC server.
4. `relayd` or any proxy that can provide TLS for `websocketd` unless you want to give `websocketd` your private key.

### Running multiserver-chat

1. Run `miniircd` or any IRC server.
2. Create a user: `echo 'username password' >> secrets`
3. Start the bouncer: `websocketd --port 9595 ./bouncer.sh`
4. Configure TLS proxy.

## Theory of operation

After the extension is loaded by StarMash, the browser initiates a websocket connection to `websocketd`.
`websocketd`, much like CGI, starts a process of `bouncer.sh` for each websocket connection.
`bouncer.sh` uses `sic` to connect to an IRC server.

