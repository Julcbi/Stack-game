
export default class gameScene extends Phaser.Scene {
    constructor() {
        super({
            key: "gameScene",
        });
    }

    preload() {
        // Load bitmap font
        this.load.bitmapFont('alienFont', 'assets/vermin.png', 'assets/vermin.xml');

        // Load sound effects
        this.load.audio('clickSound', 'assets/click.wav');
        this.load.audio('clickSound2','assets/click2.wav');
        this.load.audio('shootSound', 'assets/synth.wav');
        this.load.audio('explosionSound', 'assets/explosion.wav');

        // Create particle texture
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(4, 4, 4);
        graphics.generateTexture('particle', 8, 8);
        graphics.destroy();
    }

    init() {
        // Game state
        this.score = 0;
        this.gameTime = 100;
        this.gameOver = false;
        this.gameStarted = false;
        this.charging = false;
        this.chargeAmount = 0;
        this.maxCharge = 20000;
        this.balls = [];
        this.bumpers = [];
        this.bumperIndex = 0;
        this.bumperColors = [0xff00ff, 0x00ffff, 0xffff00, 0xff8800, 0x00ff88, 0xff0088];
    }

    create() {
        console.log("STANDUP GAME START!");
        this.camera = this.cameras.main;

        // Create sound effects
        this.clickSound = this.sound.add('clickSound', { volume: 0.5 });
        this.clickSound2 = this.sound.add('clickSound2', { volume: 0.5 });
        this.shootSound = this.sound.add('shootSound', { volume: 0.6 });
        this.explosionSound = this.sound.add('explosionSound', { volume: 0.7 });

        // Create target (square on right side)
        this.target = this.add.rectangle(width - 100, centerY, 60, 200, 0xff0000);
        this.matter.add.gameObject(this.target, {
            isStatic: true,
            isSensor: true
        });
        this.targetDirection = 1;
        this.targetSpeed = 300;

        // Create shooter position indicator (left bottom)
        this.shooterX = 100;
        this.shooterY = height - 100;
        this.shooter = this.add.circle(this.shooterX, this.shooterY, 15, 0x00ff00);

        // Create bouncy boundaries
        this.createBoundaries();

        // UI Text
        this.scoreText = this.add.bitmapText(20, 20, 'alienFont', 'Score: 0', 62);

        this.timerText = this.add.bitmapText(width - 220, 20, 'alienFont', 'Time:' + this.gameTime, 62);

        this.chargeBar = this.add.rectangle(this.shooterX, this.shooterY + 50, 0, 10, 0xffff00);

        // Mouse input
        this.input.on('pointerdown', this.startCharging, this);
        this.input.on('pointerup', this.shootBall, this);

        // Collision detection
        this.matter.world.on('collisionstart', this.handleCollision, this);

        // Enable Matter gravity for projectiles
        this.matter.world.engine.gravity.y = 0.5;

        // Create particle emitter
        this.particles = this.add.particles(0, 0, 'particle', {
            speed: { min: 50, max: 500 },
            angle: { min: 0, max: 360 },
            scale: { start: 1.5, end: 0 },
            lifespan: 800,
            gravityY: 300,
            emitting: false
        });
        this.particles.setDepth(50);

        // Show start screen
        this.showStartScreen();
    }

    showStartScreen() {
        // Darken background
        this.startOverlay = this.add.rectangle(centerX, centerY, width, height, 0x000000, 0.8);
        this.startOverlay.setDepth(100);

        // Title
        this.startTitle = this.add.bitmapText(centerX, centerY - 200, 'alienFont', 'THE RATHER MEANINGLESS\nSTANDUP GAME that\ntests your aiming skills,\ndexterity and luck!', 62, 1).setOrigin(0.5);
        this.startTitle.setDepth(101);

        this.newTween = this.tweens.add({
            targets: this.startTitle,
            scale: 1.2,
            ease: 'Bounce',       // 'Cubic', 'Elastic', 'Bounce', 'Back'
            duration: 650,
            repeat: -1,            // -1: infinity
            yoyo: true,
        });

        this.newTween2 = this.tweens.add({
            targets: this.startTitle,
            ease: 'Cubic.InOut',       // 'Cubic', 'Elastic', 'Bounce', 'Back'
            duration: 1050,
            repeat: -1,            // -1: infinity
            yoyo: true,
            // interpolation: null,
            // rotation: ...
            angle: {from: -10, to: 10},
            // alpha: ...
        });

        // Instructions
        this.startInstructions = this.add.bitmapText(centerX, centerY, 'alienFont', 'Click and hold to charge\nRelease to shoot\nHit the red target!', 24, 1).setOrigin(0.5);
        this.startInstructions.setDepth(101);

        // Start button
        this.startBtn = this.add.rectangle(centerX, centerY + 120, 250, 70, 0x00ff00);
        this.startBtn.setDepth(101);
        this.startBtn.setInteractive();

        this.startBtnText = this.add.bitmapText(centerX, centerY + 120, 'alienFont', 'START GAME', 32).setOrigin(0.5);
        this.startBtnText.setDepth(102);

        this.startBtn.on('pointerdown', () => {
            this.startGame();
        });

        this.startBtn.on('pointerover', () => {
            this.startBtn.setFillStyle(0x00cc00);
        });

        this.startBtn.on('pointerout', () => {
            this.startBtn.setFillStyle(0x00ff00);
        });

              // Fullscreen button
        this.fullscreenBtn = this.add.rectangle(centerX, centerY + 210, 250, 70, 0x0066ff);
        this.fullscreenBtn.setDepth(101);
        this.fullscreenBtn.setInteractive();

        this.fullscreenBtnText = this.add.bitmapText(centerX, centerY + 210, 'alienFont', 'FULLSCREEN', 32).setOrigin(0.5);
        this.fullscreenBtnText.setDepth(102);

        this.fullscreenBtn.on('pointerdown', () => {
            this.scale.toggleFullscreen();
        });

        this.fullscreenBtn.on('pointerover', () => {
            this.fullscreenBtn.setFillStyle(0x0044cc);
        });

        this.fullscreenBtn.on('pointerout', () => {
            this.fullscreenBtn.setFillStyle(0x0066ff);
        });


    }

    startGame() {
        // Hide start screen
        this.startOverlay.destroy();
        this.startTitle.destroy();
        this.startInstructions.destroy();
        this.startBtn.destroy();
        this.startBtnText.destroy();
        this.fullscreenBtn.destroy();
        this.fullscreenBtnText.destroy();

        // Start the game
        this.gameStarted = true;

        // Start timers
        this.time.addEvent({
            delay: 5000,
            callback: this.addBumper,
            callbackScope: this,
            loop: true
        });

        this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }

    startCharging(pointer) {
        if (!this.gameOver && this.gameStarted) {
            this.charging = true;
            this.chargeAmount = 0;
            this.clickSound2.play({ detune: Math.random() * 200 - 100 });
        }
    }

    shootBall(pointer) {
        if (!this.gameOver && this.gameStarted && this.charging) {
            this.charging = false;

            // Get pointer world position
            const pointerX = pointer.x;
            const pointerY = pointer.y;

            // Calculate direction vector from shooter to pointer
            const dirX = pointerX - this.shooterX;
            const dirY = pointerY - this.shooterY;
            const distance = Math.sqrt(dirX * dirX + dirY * dirY);

            // Normalize direction
            const normX = dirX / distance;
            const normY = dirY / distance;

            // Create ball
            const ball = this.add.circle(this.shooterX, this.shooterY, 10, 0xffffff);
            this.matter.add.gameObject(ball, {
                shape: 'circle',
                restitution: 1,
                friction: 0
            });

            // Apply velocity based on charge (much stronger multiplier)
            const power = (this.chargeAmount / this.maxCharge) * 50; // 5-35 range
            const velocityX = normX * power;
            const velocityY = normY * power;

            ball.setVelocity(velocityX, velocityY);
            ball.setAngularVelocity(0.1);

            this.balls.push(ball);

            // Play shoot sound with random pitch variation
            this.shootSound.play({ detune: Math.random() * 300 - 150 });

            // Reset charge bar
            this.chargeBar.width = 0;
            this.chargeAmount = 0;
        }
    }

    handleCollision(event) {
        event.pairs.forEach(pair => {
            const { bodyA, bodyB } = pair;

            // Check if any ball is involved in collision
            let ball = null;
            let otherObject = null;

            if (this.balls.includes(bodyA.gameObject)) {
                ball = bodyA.gameObject;
                otherObject = bodyB.gameObject;
            } else if (this.balls.includes(bodyB.gameObject)) {
                ball = bodyB.gameObject;
                otherObject = bodyA.gameObject;
            }

            // If a ball hit something, create particle explosion
            if (ball) {
                // Set particle color based on what was hit
                let particleColor = 0xffffff; // White for walls

                if (otherObject === this.target) {
                    particleColor = 0xffff00; // Yellow for target hit
                } else if (this.bumpers.includes(otherObject)) {
                    particleColor = otherObject.fillColor; // Use bumper color
                }

                this.score += 1;
                this.scoreText.setText('Score: ' + this.score);

                this.clickSound.play({ detune: Math.random() * 200 - 100 });

                // Emit particles at collision point with specific color
                this.particles.setParticleTint(particleColor);
                this.particles.emitParticleAt(ball.x, ball.y, 15);
            }

            // Check if ball hit target
            if ((bodyA.gameObject === this.target || bodyB.gameObject === this.target)) {
                const ball = bodyA.gameObject === this.target ? bodyB.gameObject : bodyA.gameObject;

                if (ball && this.balls.includes(ball)) {
                    // Hit!
                    this.score += 1000;
                    this.scoreText.setText('Score: ' + this.score);

                    // Play explosion sound with random pitch variation
                    this.explosionSound.play({ detune: Math.random() * 400 - 200 });

                    // Visual feedback
                    this.cameras.main.shake(250, 0.01);
                    this.target.setFillStyle(0xffff00);
                    this.time.delayedCall(100, () => {
                        if (this.target) this.target.setFillStyle(0xff0000);
                    });

                    // Extra particle explosion for target hit
                    this.particles.setParticleTint(0xffff00);
                    this.particles.emitParticleAt(ball.x, ball.y, 100);

                    // Remove ball
                    const index = this.balls.indexOf(ball);
                    if (index > -1) {
                        this.balls.splice(index, 1);
                    }
                    ball.destroy();
                }
            }
        });
    }

    updateTimer() {
        if (!this.gameOver && this.gameStarted) {
            this.gameTime--;
            this.timerText.setText('Time: ' + this.gameTime);

            if (this.gameTime <= 0) {
                this.endGame();
            }
        }
    }

    endGame() {
        this.gameOver = true;

        // Remove all bumpers
        this.bumpers.forEach(bumper => {
            bumper.destroy();
        });
        this.bumpers = [];

        // Remove all balls
        this.balls.forEach(ball => {
            ball.destroy();
        });
        this.balls = [];

        // Wait a moment then take screenshot
        this.time.delayedCall(100, () => {
            this.takeScreenshot();
        });

        // Darken screen
        const overlay = this.add.rectangle(centerX, centerY, width, height, 0x000000, 0.7);
        overlay.setDepth(200);

        // Game over text
        this.add.bitmapText(centerX, centerY - 150, 'alienFont', 'GAME OVER!', 64).setOrigin(0.5).setDepth(201);

        this.add.bitmapText(centerX, centerY - 50, 'alienFont', 'Final Score: ' + this.score, 78).setOrigin(0.5).setDepth(201);

        // Screenshot info
        this.screenshotText = this.add.bitmapText(centerX, centerY + 30, 'alienFont', 'Taking screenshot...', 24).setOrigin(0.5).setDepth(201);

        // Save screenshot button (will be enabled after screenshot is ready)
        this.saveBtn = this.add.rectangle(centerX - 120, centerY + 120, 200, 60, 0x0088ff);
        this.saveBtn.setDepth(201);
        this.saveBtn.setAlpha(0.5);

        const saveText = this.add.bitmapText(centerX - 120, centerY + 120, 'alienFont', 'SAVE IMAGE', 24).setOrigin(0.5).setDepth(202);

        // Restart button
        const restartBtn = this.add.rectangle(centerX + 120, centerY + 120, 200, 60, 0x00ff00);
        restartBtn.setDepth(201);
        const restartText = this.add.bitmapText(centerX + 120, centerY + 120, 'alienFont', 'PLAY AGAIN', 24).setOrigin(0.5).setDepth(202);

        restartBtn.setInteractive();
        restartBtn.on('pointerdown', () => {
            this.scene.restart();
        });

        restartBtn.on('pointerover', () => {
            restartBtn.setFillStyle(0x00cc00);
        });

        restartBtn.on('pointerout', () => {
            restartBtn.setFillStyle(0x00ff00);
        });
    }

    takeScreenshot() {
        console.log('Taking screenshot...');

        this.game.renderer.snapshot((image) => {
            console.log('Screenshot captured!');
            this.screenshotImage = image;

            // Update UI
            this.screenshotText.setText('Screenshot ready!');
            this.saveBtn.setAlpha(1);
            this.saveBtn.setInteractive();

            this.saveBtn.on('pointerdown', () => {
                this.downloadScreenshot();
            });

            this.saveBtn.on('pointerover', () => {
                this.saveBtn.setFillStyle(0x0066cc);
            });

            this.saveBtn.on('pointerout', () => {
                this.saveBtn.setFillStyle(0x0088ff);
            });
        });
    }

    downloadScreenshot() {
        if (!this.screenshotImage) return;

        // Create download link
        const link = document.createElement('a');
        link.download = `standup-score-${this.score}-${Date.now()}.png`;
        link.href = this.screenshotImage.src;
        link.click();

        console.log('Screenshot downloaded!');
        this.screenshotText.setText('Image saved!');
    }

    createBoundaries() {
        const wallThickness = 30;

        // Top boundary
        const topWall = this.add.rectangle(centerX, -wallThickness / 2, width, wallThickness, 0x666666);
        this.matter.add.gameObject(topWall, {
            isStatic: true,
            restitution: 1.2,
            friction: 0
        });

        // Left boundary
        const leftWall = this.add.rectangle(-wallThickness / 2, centerY, wallThickness, height, 0x666666);
        this.matter.add.gameObject(leftWall, {
            isStatic: true,
            restitution: 1.2,
            friction: 0
        });

        // Right boundary
        const rightWall = this.add.rectangle(width + wallThickness / 2, centerY, wallThickness, height, 0x666666);
        this.matter.add.gameObject(rightWall, {
            isStatic: true,
            restitution: 1.2,
            friction: 0
        });
    }

    addBumper() {
        if (this.gameOver) return;

        // Simple position calculation
        const x = centerX + (Math.random() - 0.5) * 800;
        const y = centerY + (Math.random() - 0.5) * 400;

        console.log(`Adding bumper ${this.bumperIndex} at x:${x}, y:${y}`);

        const color = this.bumperColors[this.bumperIndex % this.bumperColors.length];
        const bumper = this.add.circle(x, y, 20, color);
        bumper.setDepth(10); // Make sure it's visible above other objects

        this.matter.add.gameObject(bumper, {
            isStatic: true,
            restitution: 1.5,
            friction: 0
        });

        // Give bumper random movement parameters
        bumper.moveSpeed = 100 + Math.random() * 100;
        bumper.moveAngle = Math.random() * Math.PI * 2;
        bumper.moveRadius = 100 + Math.random() * 100;
        bumper.centerX = x;
        bumper.centerY = y;
        bumper.time = Math.random() * Math.PI * 2;

        this.bumpers.push(bumper);
        this.bumperIndex++;

        console.log(`Bumper added! Total bumpers: ${this.bumpers.length}`);
    }

    update(time, delta) {
        if (this.gameOver || !this.gameStarted) return;

        // Move target up and down
        this.target.y += this.targetSpeed * this.targetDirection * (delta / 1000);

        if (this.target.y <= 100) {
            this.target.y = 100;
            this.targetDirection = 1;
        } else if (this.target.y >= height - 100) {
            this.target.y = height - 100;
            this.targetDirection = -1;
        }

        // Update target body position
        this.matter.body.setPosition(this.target.body, {
            x: this.target.x,
            y: this.target.y
        });

        // Move bumpers in circular patterns
        this.bumpers.forEach(bumper => {
            bumper.time += delta / 1000;
            bumper.x = bumper.centerX + Math.cos(bumper.time * bumper.moveSpeed / 100) * bumper.moveRadius;
            bumper.y = bumper.centerY + Math.sin(bumper.time * bumper.moveSpeed / 100) * bumper.moveRadius;

            // Update bumper body position
            this.matter.body.setPosition(bumper.body, {
                x: bumper.x,
                y: bumper.y
            });
        });

        // Charge mechanic
        if (this.charging) {
            this.chargeAmount = Math.min(this.chargeAmount + delta * 100, this.maxCharge);
            this.chargeBar.width = (this.chargeAmount / this.maxCharge) * 1800;
        }

        // Clean up off-screen balls
        this.balls = this.balls.filter(ball => {
            if (ball.x < -100 || ball.x > width + 100 || ball.y < -100 || ball.y > height + 100) {
                ball.destroy();
                return false;
            }
            return true;
        });
    }
}