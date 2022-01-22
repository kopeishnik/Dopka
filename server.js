//const http = require('http')
// const ffmpeg = require('fluent-ffmpeg')
// import audioBufferSlice from 'audiobuffer-slice';

import http from 'http';
import ffmpeg from 'fluent-ffmpeg';
import pathToFfmpeg from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';
import { config } from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

const __dirname = path.resolve();

config();

const handleAudio = ( req, res ) => {
  console.log(req);
  if ( req.method === 'POST' ) {
    const fname = `tmp/${ req.files.mp3.name }`;
    req.files.mp3.mv(fname, function( error ) {
      if ( error ) return res.sendStatus(500).send(err);
    });

    if ( req.start < req.stop ) {
      res.sendStatus(400).send('start must be less than stop');
    } else {
      ffmpeg(fname)
        .setFfmpegPath(pathToFfmpeg)
        .setFfprobePath(ffprobe.path)
        .output(fname)
        .setStartTime(req.start)
        .setDuration(req.stop - req.start)
        .withAudioCodec('copy')
        .on('end', function( err ) {
          if ( !err ) {
            console.log('conversion Done');
            resolve();
          }
        })
        .on('error', function( err ) {
          console.log('error: ', err);
          reject(err);
        })
        .run();
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    res.attachment(fname);
    res.setHeader('Content-type', 'text/plain');
    res.contentType('audio/mp3');
  } else {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Cannot do this' }));
  }
};

const handleStatic = ( req, res ) => {
  fs.readFile(path.join(__dirname, 'src', 'index.html'))
    .then(contents => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
      res.setHeader('Content-Type', 'text/html');
      res.writeHead(200);
      res.end(contents);
    });
};


const server = http.createServer(( req, res ) => {
  const url = req.url;
  if ( url === '/audio' ) {
    handleAudio(req, res);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    res.setHeader('Content-Type', 'text/plain');
    res.writeHead(200);
    res.end('Hello from server');
  }
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${ PORT }`));

