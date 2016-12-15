var game = new Phaser.Game(320, 240, Phaser.AUTO, 'phaser-example', { boot: boot, preload: preload, create: create, update: update });

// --------------General Local Player Interfacing Setup
//	Function to grab Name, check if name is actually entered
var myName = askUserName(); 
// 	TO generate random x y spawn location within bounds of the game
var xin = Math.floor(Math.random() * (300 - 10 + 1)) + 10;
var yin = Math.floor(Math.random() * (230 - 10 + 1)) + 10;
// 	Keyboard input
var cursors;
var displayText;
// Will be our client actors with renderable qualities (Local & Remote will be represented by this object.)
var players = {}; 
// name <-- Key
// name.sprite, name.sprite.x, name.sprite.y
// name.yext

//---------------Projectile Setup
var projectiles;
var explosions;
var fireRate = 500;
var nextFire = 0;

// --------------General Server Interfacing Setup
var socket = io();
// To control data flow to server
var serverUpdate_count = 0; 

// Font Rendering
var style = { font: "10px Courier", fill: "#00ff44"};

function boot() {
	//scaling options
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    //have the game centered horizontally
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
    //physics system
    this.game.physics.startSystem(Phaser.Physics.ARCADE);
}

function preload() {
	game.load.image('pic', 'assets/sprites/player.png');
	game.load.start();
	game.load.image('projectile', 'assets/images/projectile.png');
	game.load.audio('music', 'assets/look_at_monkey.ogg');
	game.load.spritesheet('boom', 'assets/sprites/explode.png', 128, 128);
	game.load.start();

	//scaling options
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    //have the game centered horizontally
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
    //physics system
    this.game.physics.startSystem(Phaser.Physics.ARCADE);
}

function create() {

	// Ask server for current players online - IT WORKED
	socket.emit('knock_knock');
	
	// Create our Local hero and update the server
	createPlayer(myName, xin, yin); 

	// Tell server about our local character
	socket.emit('new_local_player',{name: myName, x: xin, y: yin, health: 5, score: 0});
	console.log('how many ppl' + Object.keys(players).length);

	// Projectiles
	projectiles = game.add.group();
    projectiles.enableBody = true;
    projectiles.physicsBodyType = Phaser.Physics.ARCADE;

	projectiles.createMultiple(30, 'projectile');
	projectiles.setAll('checkWorldBounds', true);
    projectiles.setAll('outOfBoundsKill', true);

	//  An explosion pool
    explosions = game.add.group();
    explosions.createMultiple(30, 'boom');
	explosions.setAll('anchor.x', 0.5);
    explosions.setAll('anchor.y', 0.5);
    explosions.forEach( function(explosion) {
        explosion.animations.add('boom');
    });

	// Music, because why not
	music = game.add.audio('music');
    //music.play();
		
	cursors = game.input.keyboard.createCursorKeys();
}

function update() {

    for (var key in players) {
    	//players[key].sprite.x += 0.5;
		if (players[key].sprite !== undefined){
			players[key].text.alignTo(players[key].sprite, Phaser.CENTER_TOP);
			
		} else {
			console.log(players[key].name + ' hasnt fully rendered yet');
		}
  		
	}

	// Must use velocity for physics
	players[myName].sprite.body.velocity.x = 0;
    players[myName].sprite.body.velocity.y = 0;

	if (cursors.up.isDown)
    {
    	players[myName].sprite.body.velocity.y = -70;
    }
    else if (cursors.down.isDown)
    {
    	players[myName].sprite.body.velocity.y = 70;
    }

    if (cursors.left.isDown)
    {
    	players[myName].sprite.body.velocity.x = -70;
    }
    else if (cursors.right.isDown)
    {
    	players[myName].sprite.body.velocity.x = 70;
    }

	if (game.input.activePointer.isDown){
		players[myName].rotation = game.physics.arcade.angleToPointer(players[myName].sprite);
		trigger(players[myName].rotation);
	}

    // Player Location Update (every 10 frames (1/6 of a second))
    if(serverUpdate_count < 10){
    	serverUpdate_count += 1;
    } else {
    	socket.emit('player_loc_update', players[myName].sprite.x, players[myName].sprite.y);
    	serverUpdate_count = 0;
    }

	game.physics.arcade.overlap(projectiles, players[myName].sprite, projectileHit, null, this);    
	
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

	// Name and Seperation from Remote Players
	    if (playerName == myName){
	    	players[playerName].text = game.add.text(0, 0, myName, style);
			console.log('how many ppl - our guy created - ' + Object.keys(players).length);
	    } else {
	    	players[playerName].text = game.add.text(0, 0, playerName, style);
			console.log('how many ppl - remote - ' + Object.keys(players).length);
	    }

	// Health and score
	players[playerName].health = 5;
	players[playerName].score = 0;
	players[playerName].textHealth = game.add.text(10, 10,'', style);
	players[myName].textHealth.text = 'Health: 5/5'

		// Physical and Visual Character
	players[playerName].sprite = game.add.sprite(posx, posy, 'pic');
	game.physics.enable(players[playerName].sprite, Phaser.Physics.ARCADE);
	players[playerName].sprite.anchor.setTo(0.5, 0.5);
	players[playerName].sprite.body.collideWorldBounds = true;

	console.log(playerName + ' has been rendered.')
}

socket.on('new_remote_player', function(remotePlayer){
	// Server send name, position x, position y
	createPlayer(remotePlayer.name, remotePlayer.x, remotePlayer.y);

});

socket.on('whos_here', function(playerList){
	if(Object.keys(playerList).length < 1){
		console.log('No other players on server.');
	} else {
		for(var key in playerList){
			if (typeof playerList[key].name !== "undefined"){
			createPlayer(playerList[key].name, playerList[key].x, playerList[key].y);
			}
			else {
				// Don't Create - This if check is in place, because the server creates an automatic socketid on connection. 
				// It hasnt populated it with our local char. BAD - Must REMOVE
			}
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

	if (typeof players[remotePlayer.name].sprite != 'undefined') { // strict(!) comparison
  		// character on another client has moved, here is new position
		// players[remotePlayer.name].sprite.x = remotePlayer.x;
		// players[remotePlayer.name].sprite.y = remotePlayer.y;
		game.add.tween(players[remotePlayer.name].sprite).to( {x: remotePlayer.x, y: remotePlayer.y}, 50, Phaser.Easing.Linear.None, true);
	} else {
		console.log(" Remote Player Sprite is Not Defined ")
	}
});

//----------------------------------------------------------------------------------
//----------------------------------------------------------------------------------
function trigger(angle){
	// Note this angle has a small delta because of playermovement, need to revise
	// If statement is used to not have insane amount of bullets & info sent to server
	if (game.time.now > nextFire){

		socket.emit('incoming',	angle);

		nextFire = game.time.now + fireRate;
	}
}

socket.on('incomingHit', function(projectilePlayer, angle){
	fireProjectile(projectilePlayer, angle);
});

function fireProjectile(projectilePlayer, angle){
	// Note this angle has a small delta because of playermovement, need to revise
	// If statement is used to not have insane amount of bullets & info sent to server
		var beercan = projectiles.getFirstDead();
		beercan.anchor.setTo(0.5, 0.5);
		beercan.reset(players[projectilePlayer].sprite.x-4, players[projectilePlayer].sprite.y-4);
		//beercan.rotation = angle;
		game.physics.arcade.velocityFromRotation(angle, 300, beercan.body.velocity);
		beercan.name = projectilePlayer;
}

function projectileHit(player,beercan){
	
	if (beercan.name == players[myName].name){
		console.log("just u");	
	} else {
		socket.emit('player_hit',beercan.name);

		players[myName].health--;
		players[myName].textHealth.text = 'Health: ' + players[myName].health + '/5';
		beercan.kill();

	if(players[myName].health == 0){
		stateText = game.add.text(16,120,"You died, refresh browser", { font: '20px Arial', fill: '#fff' });
		socket.disconnect();
	}

	}

}

socket.on('playerHit_serv', function(victim, attacker){
		// Play an explosion
		var explosion = explosions.getFirstExists(false);
		explosion.reset(players[victim].sprite.x, players[victim].sprite.y);
		explosion.play('boom', 30, false, true);
}.bind(this));