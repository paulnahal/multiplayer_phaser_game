var game = new Phaser.Game(320, 240, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update });

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

// Font Rendering
var style = { font: "10px Courier", fill: "#00ff44"};

function preload() {
	game.load.image('pic', 'assets/sprites/player.png');
	//scaling options
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    //have the game centered horizontally
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
	
}

function create() {
	// Create our Local hero and update the server
	createPlayer(myName, xin, yin);  
    cursors = game.input.keyboard.createCursorKeys();

	// Tell server about our local character
	socket.emit('new_local_player',{name: myName, x: xin, y: yin});

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
    	players[myName].sprite.y -= 1;
    }
    else if (cursors.down.isDown)
    {
    	players[myName].sprite.y += 1;
    }

    if (cursors.left.isDown)
    {
    	players[myName].sprite.x -= 1;
    }
    else if (cursors.right.isDown)
    {
    	players[myName].sprite.x += 1;
    }

    // Player Location Update (every 10 frames (1/6 of a second))
    if(serverUpdate_count < 10){
    	serverUpdate_count += 1;
    } else {
    	socket.emit('player_loc_update', players[myName].sprite.x, players[myName].sprite.y);
    	serverUpdate_count = 0;
    }

    
	
}
//----------------------------------------ACTOR CREATION-----------------
//----------------------------------------------------------------------------------
function askUserName() {
	name = prompt("Please enter your name:");
	if (name === "") {name = "No Name";}	// user pressed OK, but the input field was empty
	else if (name) {} 						// user typed something and hit OK
	else {name = "Lazy No Name";}  			// user hit cancel
	return name;
}

function createPlayer(playerName,posx,posy) {

	players[playerName] = {}; //Instantiaze a new player object
	players[playerName].name = myName;

    players[playerName].sprite = game.add.sprite(posx, posy, 'pic');
	    if (playerName == myName){
	    	players[playerName].text = game.add.text(0, 0, myName, style);
	    } else {
	    	players[playerName].text = game.add.text(0, 0, playerName, style);
	    }
    players[playerName].sprite.anchor.setTo(0.5, 0.5);
	console.log(playerName + ' has been rendered.')
}


socket.on('new_remote_player', function(remotePlayer){
	// Server send name, position x, position y
	createPlayer(remotePlayer.name, remotePlayer.x, remotePlayer.y);

});

socket.on('whos_here', function(playerList){
	console.log('server sent list: '+game.time.now);

	if(Object.keys(playerList).length < 1){
		console.log('No other players on server.');
	} else {
		// Load remote players on to local copy.
		for(var key in playerList){
			createPlayer(playerList[key].name, playerList[key].x, playerList[key].y);
		}
	}
}.bind(this));


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