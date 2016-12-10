var game = new Phaser.Game(320, 240, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update });

var myName = prompt("Please enter your name:");
var x_input = prompt("x from 0 to 320:");
var y_input = prompt("y from 0 to 240:");
var xin = parseInt(x_input);
var yin = parseInt(y_input);


var socket = io(); // Notice that I’m not specifying any URL when I call io(), since it defaults to trying to connect to the host that serves the page.
var clients_local_list = [];

var localPlayer = {}; // WIll be our local character
var players = {}; // WIll be our remote actors

var style = { font: "10px Courier", fill: "#00ff44"};

function preload() {

	//scaling options
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    //have the game centered horizontally
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;

    game.load.image('pic', 'assets/sprites/player.png');

}

function create() {
	// Text Style
	newLocalPlayer();
	socket.emit('new_local_player',{name: myName, pos_x: xin, pos_y: yin});
    
    
}

function update() {

    for (var key in players) {
    	players[key].sprite.x += 0.5;
  		players[key].text.alignTo(players[key].sprite, Phaser.CENTER_TOP, 16);
	}
	
}

function newLocalPlayer() {

	players["local"] = {}; //Instantiaze a new player object for local

	players["local"].name = myName;
    players["local"].sprite = game.add.sprite(xin, yin, 'pic');
    players["local"].text = game.add.text(0, 0, myName, style);
    players["local"].sprite.anchor.setTo(0.5, 0.5);
    players["local"].sprite.scale.setTo(2, 2);
}

socket.on('new_remote_player', function(remotePlayer){
	// Server send name, position x, position y

	players[remotePlayer.name] = {}; //Instantiaze a new player object for remote player

	players[remotePlayer.name].name = remotePlayer.name
    players[remotePlayer.name].sprite = game.add.sprite(remotePlayer.pos_x, remotePlayer.pos_y, 'pic');
    players[remotePlayer.name].text = game.add.text(0, 0, remotePlayer.name, style);
    players[remotePlayer.name].sprite.anchor.setTo(0.5, 0.5);
    players[remotePlayer.name].sprite.scale.setTo(2, 2);

});

socket.on('remove_remote_player', function(remotePlayer){
	// Server only sends name of player to destroy

	players[remotePlayer].sprite.destroy();
	players[remotePlayer].text.destroy();
	delete players[remotePlayer];

});

socket.on('clients_update_from_server', function(data){
        console.log(data);
});

