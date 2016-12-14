var game = new Phaser.Game(320, 240, Phaser.AUTO, 'phaser-example', { boot: boot, preload: preload, create: create, update: update });

// --------------General Local Player Interfacing Setup
//	Function to grab Name, check if name is actually entered
var myName = askUserName(); 
// 	TO generate random x y spawn location within bounds of the game
var xin = Math.floor(Math.random() * (300 - 10 + 1)) + 10;
var yin = Math.floor(Math.random() * (230 - 10 + 1)) + 10;
// 	Keyboard input
var cursors;
// Will be our client actors with renderable qualities (Local & Remote will be represented by this object.)
var players = {}; 
// name <-- Key
// name.sprite, name.sprite.x, name.sprite.y
// name.yext

// --------------General Server Interfacing Setup
var socket = io();
// To control data flow to server
var serverUpdate_count = 0; 
// To temporarily hold current players logged into server.
// Populated by server with attrib: socket(key), name, posx, posy
// Deleted after first use.
var currentServPlayers = {};

// Font Rendering
var style = { font: "10px Courier", fill: "#00ff44"};

function boot() {
	//scaling options
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    //have the game centered horizontally
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;

}

function preload() {
	
	game.load.image('pic', 'assets/sprites/player.png');
}

function create() {

	// Create our Local hero and update the server
	newLocalPlayer();
	socket.emit('new_local_player',{name: myName, x: xin, y: yin});
    
    cursors = game.input.keyboard.createCursorKeys();
}

function update() {

    for (var key in players) {
    	//players[key].sprite.x += 0.5;
		if (players[key].sprite !== undefined){
			players[key].text.alignTo(players[key].sprite, Phaser.CENTER_TOP, 16);
		} else {
			console.log(players[key].name + ' hasnt fully rendered yet');
		}
  		
	}

	if (cursors.up.isDown)
    {
    	players["local"].sprite.y -= 1;
    }
    else if (cursors.down.isDown)
    {
    	players["local"].sprite.y += 1;
    }

    if (cursors.left.isDown)
    {
    	players["local"].sprite.x -= 1;
    }
    else if (cursors.right.isDown)
    {
    	players["local"].sprite.x += 1;
    }

    // Player Location Update (every 10 frames (1/6 of a second))
    if(serverUpdate_count < 10){
    	serverUpdate_count += 1;
    } else {
    	socket.emit('player_loc_update', players["local"].sprite.x, players["local"].sprite.y);
    	serverUpdate_count = 0;
    }
    
	
}
//----------------------------------------ACTOR CREATION-----------------
//----------------------------------------------------------------------------------
function newLocalPlayer() {

	players["local"] = {}; //Instantiaze a new player object for local
	players["local"].name = myName;

	createPlayer("local", xin, yin);
}

function createPlayer(playerName,posx,posy) {

    players[playerName].sprite = game.add.sprite(posx, posy, 'pic');
	    if (playerName == "local"){
	    	players[playerName].text = game.add.text(0, 0, myName, style);
	    } else {
	    	players[playerName].text = game.add.text(0, 0, playerName, style);
	    }
    players[playerName].sprite.anchor.setTo(0.5, 0.5);
	console.log(playerName + ' has been rendered.')
}

function askUserName() {
	name = prompt("Please enter your name:");
	if (name === "") {name = "No Name";}	// user pressed OK, but the input field was empty
	else if (name) {} 						// user typed something and hit OK
	else {name = "Lazy No Name";}  			// user hit cancel
	return name;
}

socket.on('new_remote_player', function(remotePlayer){
	// Server send name, position x, position y
	players[remotePlayer.name] = {}; //Instantiaze a new player object for remote player
	players[remotePlayer.name].name = remotePlayer.name;

	createPlayer(remotePlayer.name, remotePlayer.x, remotePlayer.y);

});

socket.on('whos_here', function(playerList){

	if(Object.keys(playerList).length < 1){
		console.log('No other players on server.');
	} else {
		//Instantiaze a new player object for remote player
        for (var key in playerList) {
	    	players[playerList[key].name] = {};
			players[playerList[key].name].name = playerList[key].name;
			console.log('Welcome, say hello to: ' + playerList[key].name + ' at client ' + Object.keys(playerList));
			createPlayer(playerList[key].name, playerList[key].x, playerList[key].y);
		}
	
	}
});


//----------------------------------------------------------------------------------
//----------------------------------------------------------------------------------

socket.on('remove_remote_player', function(remotePlayer){
	// Server only sends name of player to destroy

	players[remotePlayer].sprite.destroy();
	players[remotePlayer].text.destroy();
	delete players[remotePlayer];

});

socket.on('player_move_serverSent', function(remotePlayer){

	if (players[remotePlayer.name].sprite !== undefined) { // strict(!) comparison
  		// character on another client has moved, here is new position
		// players[remotePlayer.name].sprite.x = remotePlayer.x;
		// players[remotePlayer.name].sprite.y = remotePlayer.y;
		game.add.tween(players[remotePlayer.name].sprite).to( {x: remotePlayer.x, y: remotePlayer.y}, 50, Phaser.Easing.Linear.None, true);
	} else {
		alert(" Remote Player Sprite is Not Defined ")
	}

	


	// character on another client has moved, here is new position. We must check if this character has been generated first.
	// 	if(typeof players[remotePlayer.name].sprite === 'undefined'){
	// 	console.log('remote player not created yet for movement')
	// } else {
	// 	game.add.tween(players[remotePlayer.name].sprite).to( {x: remotePlayer.pos_x, y: remotePlayer.pos_y}, 500, Phaser.Easing.Linear.None, true); 
	// }

});