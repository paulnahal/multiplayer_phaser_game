var express = require('express')
var app = express(app);
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

// Master Player List 
var playerList = {};
// [Socket.id]: [Object] {
				// name:
				// x: 
				// y:

app.use(express.static(__dirname));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

//	Listen on the 'connection' event for incoming 'socket's, and I log it to the console. (io.on first, then socket.on)

// The main idea behind Socket.IO is that you can send and receive any events you want, with any data you want. 
// Any objects that can be encoded as JSON will do, and binary data is supported too.
io.on('connection', function(socket){

	socket.on('knock_knock', function(){
		// Let new player know who is already here.
		socket.emit('whos_here', playerList);
		// Upon announcement, create new player list entry
		playerList[socket.id] = {};
	});
	console.log('playerList sent to client: '+socket.id);



	socket.on('new_local_player', function(playerInfo){
		// Adds new player and stats into playerList array
        playerList[socket.id] = playerInfo;
        console.log('New Logged on User: '+playerList[socket.id].name);

        // Send all clients (except current sender) the new user's information
        socket.broadcast.emit('new_remote_player',playerList[socket.id]);

        playersToConsole(); // Log all players to console
    });  

    socket.on('player_loc_update', function(new_x,new_y){
		// Adds new player and stats into playerList array
		console.log(playerList[socket.id].name +' has moved to new x: '+new_x+', new y: '+new_y);
		playerList[socket.id].x = new_x;
		playerList[socket.id].y = new_y;

		socket.broadcast.emit('player_move_serverSent', playerList[socket.id]);

    });

	socket.on('incoming', function(angle){
		// Adds new player and stats into playerList array
		io.emit('incomingHit',playerList[socket.id].name, angle);
    });  


		

	socket.on('disconnect', function(){
		//Searches for socket disconnected and removes from array.
		console.log('\n'+'User  '+playerList[socket.id].name+' Has Disconnected');
		
		// Send all clients (except current sender) name of player to be removed from local client.
		socket.broadcast.emit('remove_remote_player',playerList[socket.id].name);

		// Remove from Server
		removePlayer(socket.id);

		playersToConsole();

  	});

});


http.listen(process.env.PORT || 5000, function(){
  console.log('listening on', http.address().port);
});

function playersToConsole(){
        console.log('\n'+'There are '+Object.keys(playerList).length+' Players Logged On:');
        if(Object.keys(playerList).length > 0){
        	console.log(playerList);
        } else {
        	console.log('--No Players to Show--');
        }
}

function removePlayer(socketid){
		delete playerList[socketid];
}
//	Express initializes app to be a function handler that you can supply to an HTTP server (as seen in line 2).
//	We define a route handler / that gets called when we hit our website home.
//	We make the http server listen on port 3000.


	// Broadcast message to every logged in user
	// socket.on('chat message', function(msg){
    // 	io.emit('chat message', msg);
  	// });