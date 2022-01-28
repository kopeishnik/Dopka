import express from 'express';
import path from 'path';
import { config } from 'dotenv';
import ffmpeg from 'fluent-ffmpeg';
import pathToFfmpeg from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';
import multer from 'multer';
import fs from 'fs';

config();

const PORT = process.env.PORT || 5000;

const app = express();
const __dirname = path.resolve();

app.use(express.json());

const storageConfig = multer.diskStorage({
  destination: ( req, file, cb ) => {
    cb(null, 'uploads');
  },
  filename: ( req, file, cb ) => {
    cb(null, file.originalname);
  },
});

const fileFilter = ( req, file, cb ) => {

  if ( file.mimetype.includes('audio') ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(express.static(__dirname));
const upload = multer({ storage: storageConfig, fileFilter });

app.post('/crop-audio',upload.single('file'),  ( req, res ) => {
  if ( !req.file ) {
    return res.status(400).send({
      message: 'An error has occurred while uploading the file',
    }).end();
  }

  let { start, stop } = req.query;
  start = Number(start);
  stop = Number(stop);

  const filePath = req.file.path;
  if ( start > stop ) {
    res.status(400).send('start must be less than stop');
  }

  const absoluteOutputPath = path.join(__dirname, 'uploads', `new-${ req.file.originalname }`);
  const absoluteFilePath = path.join(__dirname, filePath);

  ffmpeg(absoluteFilePath)
    .setFfmpegPath(pathToFfmpeg)
    .setFfprobePath(ffprobe.path)
    .output(absoluteOutputPath)
    .setStartTime(start)
    .setDuration(stop - start)
    .withAudioCodec('libmp3lame')
    .on('end', function( err ) {
      if ( !err ) {
        console.log('conversion Done');
        res.status(200).sendFile(absoluteOutputPath);
      }
    })
    .on('error', function( err ) {
      res.status(400).send({
        message: 'An error has occurred while changing' +
          ' the file',
      }).end();
      console.error(err);
    })
    .run();
});


app.get('/style.css', ( req, res ) => {
  res.sendFile(path.join(__dirname, 'src', 'style.css'));
});

app.get('/index.js', ( req, res ) => {
  res.sendFile(path.join(__dirname, 'src', 'index.js'));
});

app.get('/', ( req, res ) => {
  res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`The server is running on port:${ PORT }...`);
});
