import { visualize } from "../src/visualizeAudio.js";

//element variables
let audioFile = document.getElementById('audio-file'),
  audio = document.getElementById('audio'),
  playbutton = document.getElementById('playme'),
  timelink = document.getElementById('jump'),
  reset = document.getElementById('reset'),
  plus1 = document.getElementById('plus1'),
  plus5 = document.getElementById('plus5'),
  minus1 = document.getElementById('minus1'),
  minus5 = document.getElementById('minus5'),
  cutIn = document.getElementById('cutIn'),
  cutOut = document.getElementById('cutOut'),
  cutButton = document.getElementById('cut-audio'),
  croppedAudio = document.getElementById('cropped-audio'),
  timeInp = document.getElementById("timeInput2"),
  audioContext, continuePlay, audioBuffer;

//internal variables

// upload audio file
audioFile.onchange = function () {
  if (this.files[0].size > 20971520) {
    alert('File is bigger than 20Mb!');
    this.value = '';
  }
  audio.src = URL.createObjectURL(this.files[0]);

  // not really needed in this exact case, but since it is really important in other cases,
  // don't forget to revoke the blobURI when you don't need it
  audio.onend = () => {
    URL.revokeObjectURL(this.src);
  };
};

//set cut in
cutIn.addEventListener(
  'click', () => {
    let inTime = audio.currentTime;
    document.getElementById('inTime').textContent = representTime(inTime);
    localStorage.setItem('inTime', inTime);
  },
  false
);

//set cut out
cutOut.addEventListener(
  'click',
  ()=> {
    let outTime = audio.currentTime;
    document.getElementById('outTime').textContent = representTime(outTime);
    localStorage.setItem('outTime', outTime);
  },
  false
);

//show duration
audio.onloadedmetadata = () => {
  document.getElementById('vidDuration').textContent = representTime(parseFloat(audio.duration));
  document.getElementById('jump').max = audio.duration;
  document.getElementById('jump').value = 0;
  document.getElementById('timeCode').textContent = '0';
  audio.pause();
};

//show timeCode
audio.ontimeupdate = () => {
  let curTimeRounded = Math.round(audio.currentTime*1000)/1000;
  document.getElementById('timeCode').textContent = representTime(parseFloat(audio.currentTime));
  document.getElementById('jump').value = curTimeRounded;
  document.getElementById('timeInput2').value = curTimeRounded;
};

function representTime(timeInSeconds){
  let representation = "",
    hours = Math.floor(timeInSeconds/3600),
    minutes = Math.floor(timeInSeconds%3600/60),
    seconds = Math.floor(timeInSeconds%60),
    milliseconds = Math.round((timeInSeconds-Math.floor(timeInSeconds))*1000);
  if (hours!==0) representation += hours+":";
  if (minutes!==0) representation += minutes+":";
  representation += seconds;
  if (milliseconds!==0) representation += "."+milliseconds;
  return representation;
}

timeInp.addEventListener('blur', ()=>{
  event.preventDefault();
  audio.currentTime = parseFloat(timeInp.value);
  document.getElementById("jump").value = parseFloat(timeInp.value);
});

//-5 button
minus5.addEventListener(
  'click',
  ()=> {
    event.preventDefault();
    audio.play();
    audio.pause();
    audio.currentTime = audio.currentTime - 5;
  },
  false
);

//-1 button
minus1.addEventListener(
  'click',
  ()=> {
    event.preventDefault();
    audio.play();
    audio.pause();
    audio.currentTime = audio.currentTime - 1;
  },
  false
);

//+1 button
plus1.addEventListener(
  'click',
  ()=> {
    event.preventDefault();
    audio.play();
    audio.pause();
    audio.currentTime = audio.currentTime + 1;
  },
  false
);

//+5 button
plus5.addEventListener(
  'click',
  ()=> {
    audio.pause();
    audio.currentTime = audio.currentTime + 5;
  },
  false
);

//set position with slider
// timelink.addEventListener(
//   'mousedown',
//   ()=> {
//     event.preventDefault();
//     continuePlay = !audio.paused;
//     audio.pause();
//   },
//   false
// );

// timelink.addEventListener(
//   'mouseup',
//   ()=> {
//     event.preventDefault();
//     document.getElementById('timeInput2').value = document.getElementById('jump').value;
//     audio.currentTime = Math.round(parseFloat(document.getElementById('jump').value)*1000)/1000;
//     document.getElementById('timeInput2').value = document.getElementById('jump').value;
//     if (continuePlay) audio.play();
//   },
//   false
// );

timelink.addEventListener(
  'click',
  ()=> {
    event.preventDefault();
    continuePlay = !audio.paused;
    audio.pause();
    document.getElementById('timeInput2').value = document.getElementById('jump').value;
    audio.currentTime = Math.round(parseFloat(document.getElementById('jump').value)*1000)/1000;
    document.getElementById('timeInput2').value = document.getElementById('jump').value;
    if (continuePlay) audio.play();
  },
  false
);

function playOrPause(){
  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
}

//play on click audio press
audio.addEventListener(
  'click',
  ()=> {playOrPause();},
  false
);

//reset
reset.addEventListener(
  'click',
  ()=> {
    audio.pause();
    audio.currentTime = 0;
    document.getElementById('jump').value = 0;
    localStorage.setItem('outTime', audio.duration);
    localStorage.setItem('inTime', '0');
    document.getElementById('outTime').textContent = document.getElementById('inTime').textContent = "";

  },
  false
);

// play audio
playbutton.addEventListener(
  'click',
  () => {
    playOrPause()
  },
  false
);

// cut the audio file
cutButton.addEventListener('click', () => {
  audioContext = new AudioContext();
  const fr = new FileReader();
  fr.onload = function () {
    let arrayBuffer = this.result;
    decode(arrayBuffer);
  };
  fr.readAsArrayBuffer(audioFile.files[0]);
});

// STEP 2: Decode the audio file ---------------------------------------
function decode(buffer) {
  audioBuffer = audioContext.decodeAudioData(buffer, split);
  visualize(audioBuffer);
}

// STEP 3: Split the buffer --------------------------------------------
function split(abuffer) {
  // calc number of segments and segment length
  let rate = abuffer.sampleRate,
    inTime = localStorage.getItem('inTime'),
    outTime = localStorage.getItem('outTime'),
    offset = Math.round(inTime * rate),
    block = Math.round((outTime - inTime) * rate);
  croppedAudio.src = URL.createObjectURL(bufferToWave(abuffer, offset, block));
}

// Convert an audio-buffer segment to a Blob using WAVE representation
function bufferToWave(abuffer, offset, len) {
  let numOfChan = abuffer.numberOfChannels,
    length = len * numOfChan * 2 + 44,
    buffer = new ArrayBuffer(length),
    view = new DataView(buffer),
    channels = [],
    i,
    sample,
    pos = 0;

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit (hardcoded in this demo)

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // write interleaved data
  for (i = 0; i < abuffer.numberOfChannels; i++) channels.push(abuffer.getChannelData(i));

  while (pos < length) {
    for (i = 0; i < numOfChan; i++) {
      // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
      // sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; // scale to 16-bit signed int
      sample *= 32768;
      view.setInt16(pos, sample, true); // update data chunk
      pos += 2;
    }
    offset++; // next source sample
  }

  // create Blob
  return new Blob([buffer], { type: 'audio/wav' });

  function setUint16(data) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}
