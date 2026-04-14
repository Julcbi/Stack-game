import levelScene from "./gameScene.js";


var config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'gameDiv',
        width: width,
        height: height
    },
    backgroundColor: '#000000',
    scene: [levelScene],
    physics: {
        default: 'matter',
        matter: {
            debug: false,
            gravity: { y: 0.5 }
        }
    }
};

var game = new Phaser.Game(config);

// Expose game instance globally for save system
window.game = game;
