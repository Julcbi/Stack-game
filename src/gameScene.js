export default class gameScene extends Phaser.Scene {
    constructor() {
        super({
            key: "gameScene",
        });
    }

    init() {
        this.gameStarted = false;

        this.blockSpeed = 300;
        this.isBlockMoving = true;
    }

    preload() {
        this.load.image("gameBG", "assets/gameBG(PH).jpg");
        this.load.image("block",  "assets/Block(PH).jpg")
    }

    create() {
        this.gameStarted = true;

        this.add.image(centerX, centerY, "gameBG").setDisplaySize(width, height);

        this.add.image(centerX, height - 270, "block")
            .setOrigin(0.5, 0.5)
            .setScale(0.5);

        this.movingBlock = this.add.image(centerX, height - 363, "block")
            .setOrigin(0.5, 0.5)
            .setScale(0.5);

        this.input.on("pointerdown", this.stopMovingBlock, this);
        this.input.keyboard.on("keydown-SPACE", this.stopMovingBlock, this);

        this.add.text(centerX, centerY, "Clean scene: ready for new logic", {
            fontSize: "32px",
            color: "#ffffff",
        }).setOrigin(0.5);
    }

    stopMovingBlock() {
        if (!this.isBlockMoving) {
            return;
        }

        this.isBlockMoving = false;
        this.blockSpeed = 0;
    }

    update(time, delta) {
        if (!this.isBlockMoving) {
            return;
        }

        this.movingBlock.x += this.blockSpeed * (delta / 1000);

        if (this.movingBlock.x > width - 200) {
            this.blockSpeed = -300;
        } else if (this.movingBlock.x < 200) {
            this.blockSpeed = 300;
        }
    }
}
