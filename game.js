// This example uses the Phaser 2.0.4 framework

// Copyright © 2014 John Watson
// Licensed under the terms of the MIT License

var GameState = function (game) {
};

// Load images and sounds
GameState.prototype.preload = function () {
    this.game.load.image('tank', 'assets/gfx/tank.png');
    this.game.load.image('bullet', 'assets/gfx/shell.png');
    this.game.load.image('turret', 'assets/gfx/turret.png');
    this.game.load.audio('pew', 'assets/sounds/pew.wav');
    this.game.load.audio('treads', 'assets/sounds/treads.wav');
};

// Setup the example
GameState.prototype.create = function () {
    // Set stage background color
    this.game.stage.backgroundColor = 0x333333;

    // constants
    this.ROTATION_SPEED = 180; // degrees/second
    this.ACCELERATION = 10; // pixels/second/second
    this.MAX_SPEED = 100; // pixels/second
    this.DRAG = 1000; // pixels/second
    this.SHOT_DELAY = 200; // milliseconds (10 bullets/second)
    this.BULLET_SPEED = 500; // pixels/second
    this.NUMBER_OF_BULLETS = 3;

    this.currentSpeed = 0;

    // Simulate a pointer click/tap input at the center of the stage
    // when the example begins running. Why?
    this.game.input.activePointer.x = this.game.width / 2;
    this.game.input.activePointer.y = this.game.height / 2;

    // Add the ship to the stage
    this.ship = this.game.add.sprite(this.game.width / 2, this.game.height / 2, 'tank');
    this.ship.anchor.setTo(0.5, 0.5);
    this.ship.angle = -90; // Point the ship up

    // Enable physics on the ship
    this.game.physics.enable(this.ship, Phaser.Physics.ARCADE);

    // Set maximum velocity
    this.ship.body.maxVelocity.setTo(this.MAX_SPEED, this.MAX_SPEED); // x, y

    // Add drag to the ship that slows it down when it is not accelerating
    this.ship.body.drag.setTo(this.DRAG, this.DRAG); // x, y

    this.ship.body.collideWorldBounds = true;

    // the turret
    this.gun = this.game.add.sprite(50, this.game.height / 2, 'turret');
    this.gun.z = 100;
    // Set the pivot point to the center of the gun
    this.gun.anchor.setTo(0.5, 0.5);

    // Create an object pool of bullets
    this.bulletPool = this.game.add.group();
    for (var i = 0; i < this.NUMBER_OF_BULLETS; i++) {
        // Create each bullet and add it to the group.
        var bullet = this.game.add.sprite(0, 0, 'bullet');
        this.bulletPool.add(bullet);

        // Set its pivot point to the center of the bullet
        bullet.anchor.setTo(0.5, 0.5);

        // Enable physics on the bullet
        this.game.physics.enable(bullet, Phaser.Physics.ARCADE);

        // Set its initial state to "dead".
        bullet.kill();
    }

    // Capture certain keys to prevent their default actions in the browser.
    // This is only necessary because this is an HTML5 game. Games on other
    // platforms may not need code like this.
    //noinspection JSValidateTypes
    this.game.input.keyboard.addKeyCapture([
        Phaser.Keyboard.LEFT,
        Phaser.Keyboard.RIGHT,
        Phaser.Keyboard.UP,
        Phaser.Keyboard.DOWN
    ]);

    // Show FPS
    this.game.time.advancedTiming = true;
    this.fpsText = this.game.add.text(
        20, 20, '', { font: '16px Arial', fill: '#ffffff' }
    );

    // Some sounds
    this.pew = this.game.add.sound("pew");
    this.treads = this.game.add.sound("treads", 0.4);
};

GameState.prototype.shootBullet = function () {
    // Enforce a short delay between shots by recording
    // the time that each bullet is shot and testing if
    // the amount of time since the last shot is more than
    // the required delay.
    if (this.lastBulletShotAt === undefined) this.lastBulletShotAt = 0;
    if (this.game.time.now - this.lastBulletShotAt < this.SHOT_DELAY) return;
    this.lastBulletShotAt = this.game.time.now;

    // Get a dead bullet from the pool
    var bullet = this.bulletPool.getFirstDead();

    // If there aren't any bullets available then don't shoot
    if (bullet === null) return;

    // Revive the bullet
    // This makes the bullet "alive"
    bullet.revive();

    // Bullets should kill themselves when they leave the world.
    // Phaser takes care of this for me by setting this flag
    // but you can do it yourself by killing the bullet if
    // its x,y coordinates are outside of the world.
    bullet.checkWorldBounds = true;
    bullet.outOfBoundsKill = true;

    // Set the bullet position to the gun position.
    bullet.reset(this.gun.x, this.gun.y);
    bullet.rotation = this.gun.rotation;

    // Shoot it in the right direction
    bullet.body.velocity.x = Math.cos(bullet.rotation) * this.BULLET_SPEED;
    bullet.body.velocity.y = Math.sin(bullet.rotation) * this.BULLET_SPEED;

    this.pew.play();
};

// The update() method is called every frame
GameState.prototype.update = function () {
    if (this.game.time.fps !== 0) {
        this.fpsText.setText(this.game.time.fps + ' FPS');
    }

    // Keep the ship on the screen
    if (this.ship.x > this.game.width) this.ship.x = 0;
    if (this.ship.x < 0) this.ship.x = this.game.width;
    if (this.ship.y > this.game.height) this.ship.y = 0;
    if (this.ship.y < 0) this.ship.y = this.game.height;

    this.gun.x = this.ship.x;
    this.gun.y = this.ship.y;

    var playTreadSound = false;
    if (this.input.keyboard.isDown(Phaser.Keyboard.LEFT) || this.input.keyboard.isDown(Phaser.Keyboard.A)) {
        // If the LEFT key is down, rotate left
        this.ship.body.angularVelocity = -this.ROTATION_SPEED;
        playTreadSound = true;
    } else if (this.input.keyboard.isDown(Phaser.Keyboard.RIGHT) || this.input.keyboard.isDown(Phaser.Keyboard.D)) {
        // If the RIGHT key is down, rotate right
        this.ship.body.angularVelocity = this.ROTATION_SPEED;
        playTreadSound = true;
    } else {
        // Stop rotating
        this.ship.body.angularVelocity = 0;
    }

    if (this.input.keyboard.isDown(Phaser.Keyboard.UP) || this.input.keyboard.isDown(Phaser.Keyboard.W)) {
        if(this.currentSpeed < this.MAX_SPEED) {
            this.currentSpeed += this.ACCELERATION;
        }
        if(this.currentSpeed > this.MAX_SPEED) {
            this.currentSpeed = this.MAX_SPEED;
        }
        playTreadSound = true;
    } else if (this.input.keyboard.isDown(Phaser.Keyboard.DOWN) || this.input.keyboard.isDown(Phaser.Keyboard.S)) {
        if(this.currentSpeed > -this.MAX_SPEED) {
            this.currentSpeed -= this.ACCELERATION;
        }
        if(this.currentSpeed < -this.MAX_SPEED) {
            this.currentSpeed = -this.MAX_SPEED;
        }
        playTreadSound = true;
    } else {
        if(this.currentSpeed > 0) {
            this.currentSpeed -= 4;
        } else if(this.currentSpeed < 0) {
            this.currentSpeed += 4;
        }
        this.ship.body.acceleration.setTo(0, 0);
    }

    game.physics.arcade.velocityFromRotation(this.ship.rotation, this.currentSpeed, this.ship.body.velocity);

    if(playTreadSound && !this.treads.isPlaying) {
        this.treads.play();
    }

    // Aim the gun at the pointer.
    // All this function does is calculate the angle using
    // Math.atan2(yPointer-yGun, xPointer-xGun)
    this.gun.rotation = this.game.physics.arcade.angleToPointer(this.gun);

    // Shoot a bullet
    if (this.game.input.activePointer.isDown) {
        this.shootBullet();
    }
};

var game = new Phaser.Game(848, 450, Phaser.AUTO, 'game');
game.state.add('game', GameState, true);