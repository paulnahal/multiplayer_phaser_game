var express = require('express')
var app = express(app);
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

var clientList = [];


app.use(express.static(__dirname));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

//	Listen on the 'connection' event for incoming 'socket's, and I log it to the console. (io.on first, then socket.on)

// The main idea behind Socket.IO is that you can send and receive any events you want, with any data you want. 
// Any objects that can be encoded as JSON will do, and binary data is supported too.
io.on('connection', function(socket){
	
	clientList.push(socket.id);
	clientsToConsole();
	sendClientUpdate();
		

	socket.on('disconnect', function(){
		//Searches for socket disconnected and removes from array.
		removeClient(socket.id);
		console.log('\n'+'User  '+socket.id+' Has Disconnected');
		clientsToConsole();
		sendClientUpdate();
  	});

});


http.listen(process.env.PORT || 5000, function(){
  console.log('listening on', http.address().port);
});

function clientsToConsole(){
		console.log('\n'+'Users Connected to Server:');
		for (i = 0; i < clientList.length; i++) { 
			console.log((i+1) + ': ' + clientList[i]);
		}
}

function sendClientUpdate(){
		io.emit('clients_update_from_server',clientList);
}

function removeClient(socketid){
		for (i = 0; i < clientList.length; i++) {
			if (clientList[i] === socketid) {
					clientList.splice(i, 1);
			}
		}
}
//	Express initializes app to be a function handler that you can supply to an HTTP server (as seen in line 2).
//	We define a route handler / that gets called when we hit our website home.
//	We make the http server listen on port 3000.


	// Broadcast message to every logged in user
	// socket.on('chat message', function(msg){
    // 	io.emit('chat message', msg);
  	// });