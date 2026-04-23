export default class gameScene extends Phaser.Scene {
    constructor() {
        super({
            key: "gameScene",
        });
    }

    init() {
        this.gameStarted = false;

        this.baseSpeed = 250;
        this.speedStep = 50;
        this.maxSpeed = 600;
        this.blockSpeed = this.baseSpeed;
        this.placedBlocks = 0;
        this.speedUpEvery = 5;
        this.speedUpAt = this.speedUpEvery;
        this.isBlockMoving = false;
        this.stackBlocks = [];
        this.blockSpacing = 0;
        this.baseBlockWidth = 300;
        this.blockHeight = 60;
        this.blockColor = 0xDB7093;
        this.blockBorderColor = 0x3a2230;
        this.blockBorderWidth = 3;
        this.movementMargin = 250;
        this.score = 0;
        this.scoreText = null;
        this.movingBlock = null;
        this.startOverlay = null;
        this.startButton = null;
        this.startLabel = null;
    }

    preload() {
        this.load.image("gameBG", "assets/gameBG.jpg");
    }

    create() {
        this.gameStarted = false;

        this.add.image(centerX, centerY, "gameBG").setDisplaySize(width, height);
        this.scoreText = this.add.text(40, 40, "Score: 0", {
            fontSize: "36px",
            color: "#ffffff",
        }).setDepth(10).setVisible(false);

        this.input.on("pointerdown", this.stopMovingBlock, this);
        this.input.keyboard.on("keydown-SPACE", this.stopMovingBlock, this);

        this.createStartButton();
    }

    stopMovingBlock() {
        if (!this.gameStarted || !this.isBlockMoving || !this.movingBlock) {
            return;
        }

        const moveDirection = this.blockSpeed >= 0 ? 1 : -1;

        this.isBlockMoving = false;
        this.blockSpeed = 0;

        const topBlock = this.stackBlocks[this.stackBlocks.length - 1];
        const overlapData = this.getOverlapData(topBlock, this.movingBlock);
        
        if (overlapData.overlapWidth <= 0) {
            this.gameOver();
            return;
        }

        if (overlapData.cutWidth > 0) {
            this.createFallingPiece(overlapData);
        }

        this.addPointsForHit(topBlock, overlapData);

        const placeBlock = this.createBlock(
            overlapData.overlapCenterX,
            this.movingBlock.y,
            overlapData.overlapWidth
        );

        this.movingBlock.destroy();
        this.stackBlocks.push(placeBlock);
        this.placedBlocks += 1;

        if (this.placedBlocks >= this.speedUpAt) {
            this.baseSpeed = Math.min(this.baseSpeed + this.speedStep, this.maxSpeed);
            this.speedUpAt += this.speedUpEvery;
        }

        this.spawnMovingBlock();
        this.scrollStack();

        this.blockSpeed = this.baseSpeed * moveDirection;
        this.isBlockMoving = true;
    }

    createStartButton() {
        this.startOverlay = this.add.rectangle(centerX, centerY, width, height, 0x000000, 0.35)
            .setDepth(20);

        this.startButton = this.add.rectangle(centerX, centerY, 260, 90, 0x2ecc71)
            .setStrokeStyle(3, 0x1f7f48, 1)
            .setDepth(21)
            .setInteractive({ useHandCursor: true });

        this.startLabel = this.add.text(centerX, centerY, "START", {
            fontSize: "36px",
            color: "#ffffff",
            fontStyle: "bold",
        }).setOrigin(0.5).setDepth(22);

        this.startButton.on("pointerover", () => {
            this.startButton.setFillStyle(0x34d47b);
        });

        this.startButton.on("pointerout", () => {
            this.startButton.setFillStyle(0x2ecc71);
        });

        this.startButton.on("pointerup", () => {
            this.startGame();
        });
    }

    startGame() {
        this.gameStarted = true;
        this.isBlockMoving = true;
        this.blockSpeed = this.baseSpeed;
        this.blockSpacing = this.blockHeight;

        if (this.stackBlocks.length === 0) {
            const baseBlock = this.createBlock(centerX, height - 100, this.baseBlockWidth);

            this.stackBlocks.push(baseBlock);
            this.spawnMovingBlock();
        }

        if (this.scoreText) {
            this.scoreText.setVisible(true);
        }

        if (this.startOverlay) {
            this.startOverlay.destroy();
            this.startOverlay = null;
        }

        if (this.startButton) {
            this.startButton.destroy();
            this.startButton = null;
        }

        if (this.startLabel) {
            this.startLabel.destroy();
            this.startLabel = null;
        }
    }

    createBlock(x, y, blockWidth) {
        return this.add.rectangle(x, y, blockWidth, this.blockHeight, this.blockColor)
            .setOrigin(0.5, 0.5)
            .setStrokeStyle(this.blockBorderWidth, this.blockBorderColor, 1);
    }

    spawnMovingBlock() {
        const topBlock = this.stackBlocks[this.stackBlocks.length - 1];

        this.movingBlock = this.createBlock(centerX, topBlock.y - this.blockSpacing, topBlock.width);
    }

    scrollStack() {
        const topBlock = this.stackBlocks[this.stackBlocks.length - 1];

        if (topBlock.y > height * 0.5) {
            return;
        }

        const targets = [...this.stackBlocks, this.movingBlock];

        this.tweens.add({
            targets,
            y: "+=" + this.blockSpacing,
            duration: 150,
            ease: "Linear",
        });
    }


    addPointsForHit(baseBlock, overlapData) {
        const accuracy = overlapData.overlapWidth / baseBlock.displayWidth;
        const sizeRatio = overlapData.overlapWidth / this.baseBlockWidth;

        let tierPoints = 0;

        if (accuracy >= 0.98) {
            tierPoints = 120;
        } else if (accuracy >= 0.90) {
            tierPoints = 80;
        } else if (accuracy >= 0.80) {
            tierPoints = 50;
        } else if (accuracy >= 0.60) {
            tierPoints = 25;
        } else {
            tierPoints = 10;
        }

        // Smaller block = higher multiplier (harder to land)
        const difficultyBonus = Phaser.Math.Clamp(1 + (1 - sizeRatio) * 3, 1, 4);
        const gained = Math.round(tierPoints * difficultyBonus);

        this.score += gained;
        this.scoreText.setText("Score: " + this.score);
    }

    getOverlapData(baseBlock, movingBlock) {
        const baseLeft = this.getBlockLeft(baseBlock);
        const baseRight = this.getBlockRight(baseBlock);
        const movingLeft = this.getBlockLeft(movingBlock);
        const movingRight = this.getBlockRight(movingBlock);

        const overlapLeft = Math.max(baseLeft, movingLeft);
        const overlapRight = Math.min(baseRight, movingRight);
        const overlapWidth = overlapRight - overlapLeft;
        const cutWidth = movingBlock.displayWidth - overlapWidth;
        const overlapCenterX = overlapLeft + (overlapWidth / 2);

        let cutCenterX = movingBlock.x;

        if (cutWidth > 0) {
            cutCenterX = movingBlock.x > baseBlock.x
                ? overlapRight + (cutWidth / 2)
                : overlapLeft - (cutWidth / 2);
        }

        return {
            overlapWidth,
            overlapCenterX,
            cutWidth,
            cutCenterX,
            y: movingBlock.y,
        };
    }

    getBlockLeft(block) {
        return block.x - (block.displayWidth / 2);
    }

    getBlockRight(block) {
        return block.x + (block.displayWidth / 2);
    }

    createFallingPiece(overlapData) {
        const cutPiece = this.createBlock(
            overlapData.cutCenterX,
            overlapData.y,
            overlapData.cutWidth,
        );

        this.tweens.add({
            targets: cutPiece,
            y: cutPiece.y + 250,
            angle: overlapData.cutCenterX > overlapData.overlapCenterX ? 18 : -18,
            alpha: 0,
            duration: 450,
            onComplete: () => cutPiece.destroy(),
        });
    }

    gameOver() {
        this.gameStarted = false;
        this.isBlockMoving = false;

        if (this.movingBlock) {
            this.movingBlock.destroy();
            this.movingBlock = null;
        }

        this.add.text(centerX, 120, "Game Over", {
            fontSize: "48px",
            color: "#ffffff",
        }).setOrigin(0.5).setDepth(10);

        this.add.text(centerX, 185, "Final Score: " + this.score, {
            fontSize: "34px",
            color: "#ffdd57",
        }).setOrigin(0.5).setDepth(10);
    }

    update(time, delta) {
        if (!this.isBlockMoving || !this.movingBlock) {
            return;
        }

        this.movingBlock.x += this.blockSpeed * (delta / 1000);

        const halfBlockWidth = this.movingBlock.displayWidth / 2;
        const minX = this.movementMargin + halfBlockWidth;
        const maxX = width - this.movementMargin - halfBlockWidth;

        if (this.movingBlock.x > maxX) {
            this.blockSpeed = -this.baseSpeed;
        } else if (this.movingBlock.x < minX) {
            this.blockSpeed = this.baseSpeed;
        }
    }
}
