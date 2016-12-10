var game = new Phaser.Game(320, 240, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update });

var myName = prompt("Please enter your name:");
var xin = Math.floor(Math.random() * (300 - 10 + 1)) + 10;
var yin = Math.floor(Math.random() * (230 - 10 + 1)) + 10;


var socket = io();
var serverUpdate_count = 0;

var currentServerPlayers = {}; // Initial master list from server

var players = {}; // WIll be our client actors

var style = { font: "10px Courier", fill: "#00ff44"};

function preload() {

	game.load.image('pic', 'assets/sprites/player.png');
	//scaling options
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    //have the game centered horizontally
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;

}

var cursors;

function create() {

	// Create all existing characters sent from server
	for (var key in currentServerPlayers) {
		createPlayer(currentServerPlayers[key].name, currentServerPlayers[key].pos_x, currentServerPlayers[key].pos_y);
	}

	// Create our Local hero and update the server
	newLocalPlayer();
	socket.emit('new_local_player',{name: myName, pos_x: xin, pos_y: yin});
    
    cursors = game.input.keyboard.createCursorKeys();
}

function update() {

    for (var key in players) {
    	//players[key].sprite.x += 0.5;
  		players[key].text.alignTo(players[key].sprite, Phaser.CENTER_TOP, 16);
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
}

socket.on('new_remote_player', function(remotePlayer){
	// Server send name, position x, position y
	players[remotePlayer.name] = {}; //Instantiaze a new player object for remote player
	players[remotePlayer.name].name = remotePlayer.name;

	createPlayer(remotePlayer.name, remotePlayer.pos_x, remotePlayer.pos_y);

});

socket.on('whos_here', function(playerList){

	currentServerPlayers = playerList;

	if(Object.keys(playerList).length < 1){
		console.log('no other players to load');
	} else {
		//Instantiaze a new player object for remote player
        for (var key in playerList) {
	    	players[playerList[key].name] = {};
			players[playerList[key].name].name = playerList[key].name;
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
	// character on another client has moved, here is new position

	players[remotePlayer.name].sprite.x = remotePlayer.pos_x;
	players[remotePlayer.name].sprite.y = remotePlayer.pos_y;

});