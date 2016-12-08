var express = require('express')
var app = express(app);
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

app.use(express.static(__dirname));
app.get('/', function(req, res){
  // res.send('<h1>Hello world</h1>'); <--- This just sends a string
  res.sendFile(__dirname + '/index.html');
});

//	Listen on the 'connection' event for incoming 'socket's,
//	and I log it to the console. (io.on first, then socket.on)

// The main idea behind Socket.IO is that you can send and receive 
//	any events you want, with any data you want. 
//	Any objects that can be encoded as JSON will do, 
//	and binary data is supported too.
io.on('connection', function(socket){
	console.log('a user connected:'+socket.id);

	socket.on('chat message', function(msg){
    	console.log('message: ' + msg);
    });

	// Broadcast message to every logged in user
	// socket.on('chat message', function(msg){
    // 	io.emit('chat message', msg);
  	// });

	socket.on('disconnect', function(){
    	console.log('user disconnected');
  	});

});


http.listen(process.env.PORT || 5000, function(){
  console.log('listening on', http.address().port);
});

//	Express initializes app to be a function handler that you can supply to an HTTP server (as seen in line 2).
//	We define a route handler / that gets called when we hit our website home.
//	We make the http server listen on port 3000.
