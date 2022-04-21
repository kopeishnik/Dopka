const visualizeAudio = ( url, audioContext ) => {
  fetch(url)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
    .then(audioBuffer => visualize(audioBuffer));
};

function visualize( buffer ) {
  draw(normalizeData(filterData(buffer)));
}

/**
 * Filters the AudioBuffer retrieved from an external source
 * @param {AudioBuffer} audioBuffer the AudioBuffer from drawAudio()
 * @returns {Array} an array of floating point numbers
 */
const filterData = audioBuffer => {
  const rawData = audioBuffer.getChannelData(0); // We only need to work with one channel of data
  const samples = 70; // Number of samples we want to have in our final data set
  const blockSize = Math.floor(rawData.length / samples); // the number of samples in each subdivision
  const filteredData = [];
  for ( let i = 0; i < samples; i++ ) {
    let blockStart = blockSize * i; // the location of the first sample in the block
    let sum = 0;
    for ( let j = 0; j < blockSize; j++ ) {
      sum = sum + Math.abs(rawData[blockStart + j]); // find the sum of all the samples in the block
    }
    filteredData.push(sum / blockSize); // divide the sum by the block size to get the average
  }
  return filteredData;
};

/**
 * Normalizes the audio data to make a cleaner illustration
 * @param {Array} filteredData the data from filterData()
 * @returns {Array} an normalized array of floating point numbers
 */
const normalizeData = filteredData => {
  const multiplier = Math.pow(Math.max(...filteredData), -1);
  return filteredData.map(n => n * multiplier);
};

/**
 * Draws the audio file into a canvas element.
 * @param {Array} normalizedData The filtered array returned from filterData()
 * @returns {Array} a normalized array of data
 */
const draw = normalizedData => {
  // set up the canvas
  const canvas = document.querySelector('canvas');
  const dpr = window.devicePixelRatio || 1;
  const padding = 20;
  canvas.width = canvas.offsetWidth * dpr;
  canvas.height = (canvas.offsetHeight + padding * 2) * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.translate(0, canvas.offsetHeight / 2 + padding); // set Y = 0 to be in the middle of the canvas

  // draw the line segments
  const width = canvas.offsetWidth / normalizedData.length;
  for ( let i = 0; i < normalizedData.length; i++ ) {
    const x = width * i;
    let height = normalizedData[i] * canvas.offsetHeight - padding;
    if ( height < 0 ) {
      height = 0;
    } else if ( height > canvas.offsetHeight / 2 ) {
      height = height > canvas.offsetHeight / 2;
    }
    drawLineSegment(ctx, x, height, width, (i + 1) % 2);
  }
};

/**
 * A utility function for drawing our line segments
 * @param {AudioContext} ctx the audio context
 * @param {number} x  the x coordinate of the beginning of the line segment
 * @param {number} height the desired height of the line segment
 * @param {number} width the desired width of the line segment
 * @param {boolean} isEven whether or not the segmented is even-numbered
 */
const drawLineSegment = ( ctx, x, height, width, isEven ) => {
  ctx.lineWidth = 1; // how thick the line is
  ctx.strokeStyle = '#FFFFFF'; // what color our line is
  ctx.beginPath();
  height = isEven ? height : -height;
  ctx.moveTo(x, 0);
  ctx.lineTo(x, height);
  ctx.arc(x + width / 2, height, width / 2, Math.PI, 0, isEven);
  ctx.lineTo(x + width, 0);
  ctx.stroke();
};


const sendAudio = ( buffer ) => {
  fetch('http://localhost:5000/audio', {
    method: 'POST',
    headers: {
      'Content-Type': 'audio/mp3',
    },
    body: buffer,
  })
    .then(data => console.log(data));
};

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
  timeInp = document.getElementById('timeInput2'),
  audioInputForm = document.getElementById('audio-input-form'),
  audioContext, continuePlay;

//internal variables

audioInputForm.addEventListener('submit', event => {
  event.preventDefault();

  const formData = new FormData(event.target);
  const inTime = localStorage.getItem('inTime');
  const outTime = localStorage.getItem('outTime');
  fetch(`/crop-audio?start=${inTime}&stop=${outTime}`, {
    method: 'POST',
    body: formData,
  })
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer, split))
    // .then(audioBuffer => croppedAudio.src = URL.createObjectURL(audioBuffer));
});

// upload audio file
audioFile.addEventListener('change', ( { target } ) => {
  if ( !target.files.length ) return;

  if ( target.files[0].size > 20971520 ) {
    alert('File is bigger than 20Mb!');
    this.value = '';
  }

  const urlObj = URL.createObjectURL(target.files[0]);
  audio.src = urlObj;

  audioContext = new AudioContext();
  visualizeAudio(urlObj, audioContext);
  audio.addEventListener('load', () => {
    URL.revokeObjectURL(urlObj);
  });
});

//set cut in
cutIn.addEventListener(
  'click', () => {
    let inTime = audio.currentTime;
    document.getElementById('inTime').textContent = representTime(inTime);
    localStorage.setItem('inTime', inTime);
  },
  false,
);

//set cut out
cutOut.addEventListener(
  'click',
  () => {
    let outTime = audio.currentTime;
    document.getElementById('outTime').textContent = representTime(outTime);
    localStorage.setItem('outTime', outTime);
  },
  false,
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
  let curTimeRounded = Math.round(audio.currentTime * 1000) / 1000;
  document.getElementById('timeCode').textContent = representTime(parseFloat(audio.currentTime));
  document.getElementById('jump').value = curTimeRounded;
  document.getElementById('timeInput2').value = curTimeRounded;
};

function representTime( timeInSeconds ) {
  let representation = '',
    hours = Math.floor(timeInSeconds / 3600),
    minutes = Math.floor(timeInSeconds % 3600 / 60),
    seconds = Math.floor(timeInSeconds % 60),
    milliseconds = Math.round((timeInSeconds - Math.floor(timeInSeconds)) * 1000);
  if ( hours !== 0 ) representation += hours + ':';
  if ( minutes !== 0 ) representation += minutes + ':';
  representation += seconds;
  if ( milliseconds !== 0 ) representation += '.' + milliseconds;
  return representation;
}

timeInp.addEventListener('blur', () => {
  event.preventDefault();
  audio.currentTime = parseFloat(timeInp.value);
  document.getElementById('jump').value = parseFloat(timeInp.value);
});

//-5 button
minus5.addEventListener(
  'click',
  () => {
    event.preventDefault();
    audio.play();
    audio.pause();
    audio.currentTime = audio.currentTime - 5;
  },
  false,
);

//-1 button
minus1.addEventListener(
  'click',
  () => {
    event.preventDefault();
    audio.play();
    audio.pause();
    audio.currentTime = audio.currentTime - 1;
  },
  false,
);

//+1 button
plus1.addEventListener(
  'click',
  () => {
    event.preventDefault();
    audio.play();
    audio.pause();
    audio.currentTime = audio.currentTime + 1;
  },
  false,
);

//+5 button
plus5.addEventListener(
  'click',
  () => {
    audio.pause();
    audio.currentTime = audio.currentTime + 5;
  },
  false,
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
  () => {
    event.preventDefault();
    continuePlay = !audio.paused;
    audio.pause();
    document.getElementById('timeInput2').value = document.getElementById('jump').value;
    audio.currentTime = Math.round(parseFloat(document.getElementById('jump').value) * 1000) / 1000;
    document.getElementById('timeInput2').value = document.getElementById('jump').value;
    if ( continuePlay ) audio.play();
  },
  false,
);

function playOrPause() {
  if ( audio.paused ) {
    audio.play();
  } else {
    audio.pause();
  }
}

//play on click audio press
audio.addEventListener(
  'click',
  () => {
    playOrPause();
  },
  false,
);

//reset
reset.addEventListener(
  'click',
  () => {
    audio.pause();
    audio.currentTime = 0;
    document.getElementById('jump').value = 0;
    localStorage.setItem('outTime', audio.duration);
    localStorage.setItem('inTime', '0');
    document.getElementById('outTime').textContent = document.getElementById('inTime').textContent = '';

  },
  false,
);

// play audio
playbutton.addEventListener(
  'click',
  () => {
    playOrPause();
  },
  false,
);

// cut the audio file
// cutButton.addEventListener('click', () => {
//   audioContext = new AudioContext();
//   const fr = new FileReader();
//   fr.onload = function() {
//     let arrayBuffer = this.result;
//     decode(arrayBuffer);
//   };
//   fr.readAsArrayBuffer(audioFile.files[0]);
// });

// STEP 2: Decode the audio file ---------------------------------------
function decode( buffer ) {
  audioContext.decodeAudioData(buffer, split);
}

// STEP 3: Split the buffer --------------------------------------------
function split( abuffer ) {
  // calc number of segments and segment length
  let rate = abuffer.sampleRate,
    inTime = localStorage.getItem('inTime'),
    outTime = localStorage.getItem('outTime'),
    offset = Math.round(inTime * rate),
    block = Math.round((outTime - inTime) * rate);
  croppedAudio.src = URL.createObjectURL(bufferToWave(abuffer, offset, block));
}

// Convert an audio-buffer segment to a Blob using WAVE representation
function bufferToWave( abuffer, offset, len ) {
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
  for ( i = 0; i < abuffer.numberOfChannels; i++ ) channels.push(abuffer.getChannelData(i));

  while (pos < length) {
    for ( i = 0; i < numOfChan; i++ ) {
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

  function setUint16( data ) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32( data ) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}


