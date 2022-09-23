/**
DON'T BE AFRAID is a game about playing the cowbell.

As the player plays the cowbell,
a ghost floats to the right.

The game is won when the ghost reaches
the right side of the screen.

If the song ends before that
happens, the game is lost.

Diligent cowbellers are rewarded with a playback
of their performance, and some fanservice.

Max Spedale
September 2022
*/

//constants
  const LAG_OFFSET = -40;
  const BGM_VOLUME = 0.2;
  const ANGEL_VOLUME = 0.3;
  const APPLAUSE_VOLUME = 0.1;
  const TIME_TILL_WALKEN_GETS_SAD = 3000;
  const URL_WALKEN_HAPPY = 'url("img/walkenSmile.png")';
  const URL_WALKEN_SAD = 'url("img/walkenSad.png")';
  const URL_CHERUB_IMAGE = 'url("img/will1.png")';
  const URL_CHERUBPLAYING_IMAGE = 'url("img/will2.png")';
  const WALKEN_MAX_OPACITY = '0.7';
  const WALKEN_OPACITY_ON_START = '0';
  const MOVEMENT_SPEED = '5500'; //song length/steps to win (max:6000 preferred:5500)
  const LENGTH_OF_SONG = '509';
  const KEYCODE_ENTER = 13;
  const KEYCODE_W = 87;
  const PROGRESS_TO_WIN = 50; //corresponds to left position in vw

//page elements
  var gameScreen = document.getElementById("gameScreen");
  var cowbell = document.getElementById("img-cowbell");
  var cowbellSound = document.getElementById("audio-cowbell");
  var bgm = document.getElementById("audio-bgm");
  var applause = document.getElementById("applause");
  var angelSound = document.getElementById("audio-angels");
  var splash = document.getElementById("splash");
  var splashSubtitle = document.getElementById("splash-subtitle");
  var curtain1 = document.getElementById("curtain1");
  var curtain2 = document.getElementById("curtain2");
  var walken = document.getElementById("walken");
  var whiteScreen = document.getElementById("whiteScreen");
  var clouds = document.getElementById("clouds");
  var gameOverScreen = document.getElementById("gameOverScreen");
  var credits = document.getElementById("credits");
  var credits_sub = document.getElementById("credits-subtitle");
  var cherub = document.getElementById("cherub");

var sadTimer;
var advanceTimer;
var regressTimer;

window.onload = init();

function init() {
  bgm.volume = BGM_VOLUME; //so I don't kill myself while working on this
  angelSound.volume = ANGEL_VOLUME;
  applause.volume = APPLAUSE_VOLUME;

  //event handlers
  setEventHandlers();

  //CSS properties I want to control
  setCssProperties();

  console.log("initialized.");
}

function setEventHandlers() {
  splash.onclick = handleSplashClick;
  cowbell.onmousedown = handleCowbellClick;
  bgm.onended = handleSongEnding;
  document.onkeypress = handleKeyPress;
}

function setCssProperties() {
  walken.style.left = '0vw';
  walken.style.backgroundImage = URL_WALKEN_HAPPY;
  walken.style.opacity = WALKEN_OPACITY_ON_START;
  walken.style.top = '0vh';
  gameOverScreen.style.zIndex = -100;
  splash.style.opacity = 1;
  whiteScreen.style.opacity = 0;
  clouds.style.bottom = '0vh';
  cherub.style.backgroundImage = URL_CHERUB_IMAGE;
  cowbell.style.pointerEvents = 'auto';
  credits.style.opacity = 0;
  credits_sub.style.opacity = 0;
}

function handleCowbellClick(e) {
  model.walkenIsPleased();
  view.ding();
  model.recording.push(e.timeStamp - model.timeStampOffset);
}

function handleSongEnding() {
  console.log("song over. calling displayGameOver()");
  model.cleanUp();
  view.displayGameOver();
}

function handleSplashClick(e) {
  view.startMusic();
  applause.play();
  view.fadeSplashScreen();
  view.drawCurtains();
  model.timeStampOffset = e.timeStamp;
  splashSubtitle.innerHTML = "(break a leg!)";
}

function handleKeyPress(e) {
  //for debug purposes.
  if (e.keyCode === KEYCODE_ENTER) {
      view.endMusic();
  } else if (e.keyCode === KEYCODE_W) {
      view.displayWinStuff();
  }
}

var model = {
  isAdvancing: false,
  walkenProgress: 0,      //0-50
  recording: new Array(),
  timeStampOffset: 0,

  walkenIsPleased: function() {
    view.makeHimSmile();
    view.makeHimAppear();

    //set/reset timer that makes him sad if they stop
    this.delayDisappointment();

    //position continues to advance
    this.advanceWalkenProgress();
  },

  delayDisappointment: function() {
    window.clearTimeout(sadTimer);
    sadTimer = setTimeout(()=>{
      this.walkenIsSad();
    }, TIME_TILL_WALKEN_GETS_SAD);
  },

  walkenIsSad: function() {
    //face becomes sad
    var currentWalken = walken.style.backgroundImage;
    if (currentWalken == URL_WALKEN_HAPPY) {
      walken.style.backgroundImage = URL_WALKEN_SAD;
      walken.style.backgroundSize = 'fit';
      console.log("sad face on.");
    }

    //position begins regressing
    this.reduceWalkenProgress();

    //face fades away
    walken.style.opacity = 0;
  },

  advanceWalkenProgress: function() {
    //start a loop that continues to advance walken.
    //only start a loop if one isn't already going.
    if (!model.isAdvancing) {
      window.clearTimeout(regressTimer);
      this.walkenAdvancer();
      console.log("begin advancing.");
    }
  },

  /*
    Assumes !model.isAdvancing.
    Repeatedly steps walken forward until game is
    won. Or by clearTimeout() elsewhere.
  */
  walkenAdvancer: function() {
    this.isAdvancing = true;

    if (!this.checkWinCondition()){
      advanceTimer = setTimeout(()=>{
        view.moveHimTo(++this.walkenProgress);
        this.walkenAdvancer();
        console.log("advance step.");
      },MOVEMENT_SPEED);
    }
  },

  reduceWalkenProgress: function() {
    //start a loop that continues to regress walken.
    //only start a loop if one isn't already going.
    if (this.isAdvancing) {
      window.clearTimeout(advanceTimer);

      //to get the regress going instantly:
      view.moveHimTo(this.walkenProgress--);

      this.walkenRegresser();
      console.log("begin regressing.");
    }
  },

  /*
    Repeatedly steps walken backward.
    Stopped by clearTimeout() elsewhere.
  */
  walkenRegresser: function() {
    this.isAdvancing = false;

    regressTimer = setTimeout(()=>{
      view.moveHimTo(--this.walkenProgress);
      this.walkenRegresser();
      console.log("regress step.");
    },MOVEMENT_SPEED);
  },

  checkWinCondition: function() {
    if (this.walkenProgress >= PROGRESS_TO_WIN) {
      this.cleanUp();
      view.displayWinStuff();
      return true;
    } else {
      return false;
    }
  },

  cleanUp: function() {
    bgm.pause();
    bgm.currentTime = 0;
    window.clearTimeout(sadTimer);
    window.clearTimeout(advanceTimer);
    window.clearTimeout(regressTimer);
  }
};

var view = {
  ding: function() {
    //sound
    cowbellSound.currentTime = 0;   //to deal with fast clicks.
    cowbellSound.play();

    //animation
    cowbell.classList.add("playing");
    setTimeout(()=>{
      cowbell.classList.remove("playing");
    }, 50);
    console.log("moo");
  },

  startMusic: function() {
    bgm.play();
    console.log("playing bgm..");
  },

  endMusic: function() {
    bgm.currentTime = LENGTH_OF_SONG - 3;
    console.log("skipping to the end of the song.");
  },

  fadeSplashScreen: function() {
    splash.style.opacity = 0;

    //delay burying splash screen till fade is complete
    setTimeout(()=>{
      splash.remove();
    }, 5000);
    console.log("fading splash screen..");
  },

  drawCurtains: function() {
    curtain1.classList.add("drawnLeft");
    curtain2.classList.add("drawnRight");
    console.log("drawing curtains..");
    setTimeout(()=>{
      curtain1.remove();
      curtain2.remove();
    },10000);
  },

  makeHimSmile: function() {
    var currentWalken = walken.style.backgroundImage;
    if (currentWalken == URL_WALKEN_SAD) {
      walken.style.backgroundImage = URL_WALKEN_HAPPY;
      console.log("happy face on.");
    }
  },

  makeHimAppear: function() {
    walken.style.opacity = WALKEN_MAX_OPACITY;
  },

  moveHimTo: function(x) {
    walken.style.left = x + 'vw';   //moves walken.
  },

  playbackUserPerformance: function() {
    for (var i=0; i<model.recording.length; i++) {
      setTimeout(()=>{
        this.cherubDing();
      },model.recording[i] + LAG_OFFSET);
    }
  },

  cherubDing: function() {
    cowbellSound.currentTime = 0;
    cowbellSound.play();

    cherub.style.backgroundImage = URL_CHERUBPLAYING_IMAGE;
    setTimeout(()=>{
      cherub.style.backgroundImage = URL_CHERUB_IMAGE;
    }, 50);
  },

  displayWinStuff: function() {
    angelSound.play();
    cowbell.style.pointerEvents = 'none';
    walken.style.top = '-100vh';
    whiteScreen.style.opacity = 1;
    setTimeout(()=>{
      this.ascension();
    },4000);
  },

  ascension: function() {
    gameScreen.remove();
    bgm.play();
    this.playbackUserPerformance();
    whiteScreen.style.opacity = 0;
    clouds.style.bottom = '-1900vh';
    setTimeout(()=>{
      this.rollCredits();
    }, 9000);
  },

  rollCredits: function() {
    console.log("rolling credits.");
    credits.style.opacity = 1;
    setTimeout(()=>{
      this.continueRollCredits();
    },4000);
  },

  continueRollCredits: function() {
    console.log("rolling subcredits.");
    credits_sub.style.opacity = 1;
    setTimeout(()=>{
      credits_sub.style.opacity = 0;
      setTimeout(()=>{
        credits_sub.innerHTML = "you really played the heck outta that cowbell.";
        credits_sub.style.opacity = 1;
        setTimeout(()=>{
          credits_sub.style.opacity = 0;
        },4000);
      },4000);
    },6000);
  },

  displayGameOver: function() {
    gameOverScreen.style.zIndex = 100;
  }
}

/*
TODO
-crop faces so the transition is less jarring
-end credits
*/
