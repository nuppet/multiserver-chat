# multiserver-chat

Multiserver Chat (MSC) is an external back channel chat extension for StarMash.
When loaded, MSC works like a party line.
It also attempts to emulate team chat.
Because it uses an IRC server, it can benefit from IRC features like bots and services.

StarMash is a javascript modification to [AirMash](https://airma.sh).

## Client side usage

Configure ws-chat-bridge.js and then place it on the web.
Direct StarMash to load this file as an extension.

### Client side development

In js console try:

    bouncerServer = "wss://server:port"
    setup()

## Server side usage

### Prerequisites

1. [websocketd](http://websocketd.com/) provides CGI but for websockets.
2. [sic](https://tools.suckless.org/sic/) provides the IRC connection.
3. [miniircd](https://github.com/jrosdahl/miniircd) or any IRC server.
4. [nginx](https://www.nginx.com/) or any proxy that can provide TLS for `websocketd` unless you want to give `websocketd` your private key.

### Running multiserver-chat

1. Run `miniircd` or any IRC server.
2. Create a user: `echo 'username password' >> secrets`
3. Edit `bouncer.sh` to configure it. Default IRC server is `localhost:6667`.
3. Start the bouncer: `websocketd --port 8586 ./bouncer.sh`
4. Configure TLS proxy.

## Theory of operation

### Servers and ports

Web client connects to `public-server:forwarding-port` and is proxied to `localhost:websocketd-port` which connects to `irc-server:irc-port`.

### Programs

After the extension is loaded by StarMash, the browser initiates a websocket connection to `websocketd`.
`websocketd`, much like CGI, starts a process of `bouncer.sh` for each websocket connection.
`bouncer.sh` uses `sic` to connect to an IRC server.

#### IRC Server

The IRC server just needs to work as a normal IRC server.
This should be exclusive to the back channel because all authentication is prior to connecting.

#### `bouncer.sh`

Performs password based authentication.
Marries a websocket connection to a new or existing IRC session.
One user can connect multiple times.
Receives all input from user, blocks nick changing, but passes everything else to `sic`.
Sends all output to user.

Any changes made to this file will be effective on the next websocket connection.

#### `ws-chat-bridge.js`

This is the user interface. Only shows a subset of messages and attempts to parse them. See javascript console.

Any changes made to this file will be effective next time it is reloaded by the browser.

#### `websocketd`

Simply pipes STDIN and STDOUT through websockets.
Each connection is a new process.

#### TLS proxy

Proxy from chat.example.com:webserver-port to localhost:websocketd-port.

Example nginx config:

````
server {

  listen <webserver-port> ssl;
  server_name chat.example.com;

  ssl_certificate /etc/letsencrypt/live/chat.example.com/fullchain.pem; # managed by Certbot
  ssl_certificate_key /etc/letsencrypt/live/chat.example.com/privkey.pem; # managed by Certbot
  include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
  ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

  location / {
    proxy_pass  http://localhost:<websocketd-port>;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";

    # Timeout configuration.
    # proxy_redirect off;

    proxy_connect_timeout       300;
    proxy_send_timeout        86400;
    proxy_read_timeout        86400;
  }
}
````

#### `sic`

A simple IRC client. It's a step up from netcat. Try it from the command line:

````
$ rlwrap sic
:join #starmash
:s #starmash
hello world!
:quit
````

