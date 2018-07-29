// Multi Server Chat

bouncerServer = "ws://100.115.92.2:9595"
discordChannel = "#in-game-related"
mainChannel = "#general"
usersOnline = null;

function parse(line) {
	// chat message
	// 1-to 2-date 3-from 4-message
	let msg = /(\S*).*?: (\S* \S*) \<(.*)\> (.*)/.exec(line);

	// server message
	// 1-from 2-date 3->< 4-action 5-target 6-target 7-message
	if (msg == null)
		msg = /(\S*).*?: (\S* \S*) (><) (\S*) \((\S*)? ?=? ?(#?\S*) ?(\S?)?\):.?(.*)/.exec(line);

	// "raw"
	if (msg == null)
		return line;

	// with the regex's above
	// msg[3]    == "><" indicates a server message
	// msg[3][0] == "<" indicates a chat message
	if (msg[3] == "><") {
		switch (msg[4]) {
			case 'JOIN': // join
				usersOnline = usersOnline.concat(msg[1]);
				return msg[5] + ": " + msg[1] + " joined.";
			case 'PART': // part
				usersOnline = usersOnline.filter(name=>name!=msg[1]);
				return msg[5] + ": " + msg[1] + " left.";
			case 'QUIT': // quit
				usersOnline = usersOnline.filter(name=>name!=msg[1]);
				return msg[5] + ": " + msg[1] + " quit.";
			case '322':  // list
				if (msg[7]==0)
					return null;
				return msg[6] + " " + msg[7];
			case '353':  // names
				if (msg[6] == mainChannel) {
					usersOnline = msg[8].split(" ");
				}
				return "On " + msg[6] + ": " + msg[8];
		}
	} else {
		if (msg[1][0] == "#") {
			return msg[1] + ": <" + msg[3] + "> " + msg[4];
		} else {
			return msg[3] + " -> " + msg[1] + ": " + msg[4];
		}
	}
}

function setup() {
	ws = new WebSocket(bouncerServer);

	ws.onopen = function(e) {
		console.log("Multi server chat connection established");
		ws.send("test"); // password
		ws.send("/join " + mainChannel + "," + discordChannel);
	};

	msglog = [];

	ws.onmessage = function(e) {
		msglog.push(event.data);
		console.log("#" + msglog.length + ": " + event.data);
		print(parse(event.data));
	};

	ws.onerror = function(e) {
		console.log("Disconnected from Multi Server Chat: ", e);
		ws.close();
	};

	ws.onclose = function(e) {
		console.log("Multi server chat onnection closed: ", e);
	};
}

// Internal commands

let teamChannel = null;

function reTeam(newTeamChannel) {
	if (game.myTeam == game.myID) {
		if (teamChannel != null) {
			ws.send("/part " + teamChannel);
			teamChannel = null;
		}
	}
	let newTeamChannel = "#" + game.playHost + game.playPath + game.myTeam;
	ws.send("/part " + teamChannel);
	ws.send("/join " + newTeamChannel);
	teamChannel = newTeamChannel;
}

function print(msg) {
	if (msg == null)
		return;

	if (SWAM == undefined)
		console.log(msg);

	UI.addChatMessage(UI.escapeHTML(msg));
}

// External commands

function discordChat(msg) {
	ws.send("/m " + discordChannel + " " + msg);
}

function pubChat(msg) {
	ws.send("/m " + mainChannel + " " + msg);
}

function teamChat(msg, inGameName) {
	ws.send("/m " + teamChannel + " " + inGameName + ": "+ msg);
}

function whisper(name, msg) {
	ws.send("/m " + name + " " + msg);
}

function names() {
	ws.send("/names " + mainChannel);
	if (teamChannel != null) {
		ws.send("/names " + teamChannel);
	}
}

function raw(msg) {
	ws.send(msg);
}

function help() {
	print("//hello world! -- //t hello team! -- //w nup hello nup!");
	print("//n (names)");
}

// SWAM

// discordChat "//d "
// teamChat "//t "   0,4 4-
// whisper  "//{w,m} "   0,4 4-
// whisper  "//pm "   0,5 5-
// names    "//n"  0,5
// help     "//h" 0,6
// pubChat  "//"     0,2 2-
// raw      "//raw " 0,5 6

// Go!

// bouncerServer = "wss://server:port""
// setup();

