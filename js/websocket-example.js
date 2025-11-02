var logToConsole = true;
var logToFile = true;
var loggerWebSocket;

var Logger =
{
	log : function(message, messageToFile)
	{
		if (logToConsole)
		{
			console.log(message);
		}
		if (logToFile && messageToFile)
		{
			loggerWebSocket.emit('logMessage', {message: message});
		}
		const splitTextareaContent = $('#console')[0].innerHTML.split('<br>');
		if (splitTextareaContent.length >= 200)
		{
			splitTextareaContent.shift();
		}
		const formattedMessage = moment().format('lll') + ': ' + message;
		$('#console')[0].innerHTML = [...splitTextareaContent, formattedMessage].join('<br>');
		$('#console')[0].scrollTop = $('#console')[0].scrollHeight;
	}
}

if (logToFile)
{
	loggerWebSocket = io.connect('http://' + window.location.hostname + ':' + window.location.port + '/logger');
	loggerWebSocket.on('connect', function(){
		Logger.log('loggerWebSocket.on connect');
	});
}