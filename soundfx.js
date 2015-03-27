

function init() {

    //Adding sounds to the file.
    var audioPath = 'Sounds/';
    var sounds = [
      {id:"cannon", src:"cannon.mp3"},
      {id:"hit", src:"hit.mp3"},
      {id:"aim", src:"aim.mp3"}
    ];
    
    //Loading the sounds.
    createjs.Sound.addEventListener('fileload', handleLoad);
    createjs.Sound.registerSounds(sounds, audioPath);

};

function handleLoad(event) {
    createjs.Sound.play(/*sound*/);
}





<script src="http://code.createjs.com/soundjs-0.5.2.min.js"></script>


