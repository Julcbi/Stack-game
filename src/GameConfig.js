const gameConfig = {
  gameTitle        : "GameTitle",
  version          : "0.1b",
  screenResolution : { width : 2000,  height : 1000}, // comments if needed.
  ratio            : 1,
  sceneFadeTime    : 500,
  gameTimeInSeconds: 60,
  defaultFont      : "FontBold",
  hasHintpad       : false,
  hintpadData      : { hintpadIP : "128.0.0.0", hintpadMessage : " - up and running!"},
  devMode          : true,
  devModeOptions   : {disableConsoleLog :  false, showMouseCoords: false}, //
  keyboardActive   : false,
  maxParticles :      10000
}

var width      = gameConfig.screenResolution.width;
var height     = gameConfig.screenResolution.height;
var centerX    = width * 0.5;
var centerY    = height * 0.5;
