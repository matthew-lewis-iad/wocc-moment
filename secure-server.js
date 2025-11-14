var express = require('express');
var app = express();
const https = require('https');
var fs = require('fs-extra');

const key = fs.readFileSync('./cert/wocc-ar.key');
const cert = fs.readFileSync('./cert/wocc-ar.crt');

// const CONFIG_PATH_APP = './config/config.json';
const CONFIG_PATH_SERVER = './config/server.config.json';

// var appConfig = JSON.parse(fs.readFileSync(CONFIG_PATH_APP));
var serverConfig = JSON.parse(fs.readFileSync(CONFIG_PATH_SERVER));

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

// var server = app.listen(serverConfig.port, function () {
// 	console.log('listening on port ' + serverConfig.port);
// });

const server = https.createServer({key: key, cert: cert }, app).listen(serverConfig.exhibitPort, function () {
    console.log('listening on port ' + serverConfig.exhibitPort);
});

app.get("/", function (req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.get(/^(.+)$/, function (req, res) {
	res.sendFile(__dirname + req.params[0]);
});
