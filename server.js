const express = require('express');
const app = express();
const fs = require('fs-extra');
// const io = require('socket.io');

// const CONFIG_PATH_APP = './config/config.json';
const CONFIG_PATH_SERVER = './config/server.config.json';

// var appConfig = JSON.parse(fs.readFileSync(CONFIG_PATH_APP));
var serverConfig = JSON.parse(fs.readFileSync(CONFIG_PATH_SERVER));

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

app.listen(serverConfig.exhibitPort, function () {
	console.log('listening on port ' + serverConfig.exhibitPort);
});

app.get("/", function (req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.get(/^(.+)$/, function (req, res) {
	res.sendFile(__dirname + req.params[0]);
});


/* Message Websocket Server */

// var websocketServer = io(server);
// var messageWebsocketServer = websocketServer.of('/message');
//
// messageWebsocketServer.on('connection', function(socket)
// {
// 	console.log('messageWebsocketServer : connection - ' + socket.id);
// 	socket.emit('connected');
//
// 	socket.on(commonConfig.websocketMessages.MESSAGE_REFRESHBROWSER, function() {
// 		socket.broadcast.emit(commonConfig.websocketMessages.MESSAGE_REFRESHBROWSER);
// 	});
// });

/* Global Methods */

function writeTextToFile(path, text, description, callback) {
    var temp_path = path;
    fs.outputFile(temp_path, text, function (err) {
        if (err) {
            console.log('error writing file ' + path + ' - ' + err);
            return;
        }
        console.log(description + ' success');
        if (callback != null) {
            callback();
        }
    });
}
