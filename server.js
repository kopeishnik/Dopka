import express from 'express';
import path from 'path';
import { config } from 'dotenv';
import ffmpeg from 'fluent-ffmpeg';
import pathToFfmpeg from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';
import multer from 'multer';

config();

const PORT = process.env.PORT || 5000;

const app = express();
const __dirname = path.resolve();

const storageConfig = multer.diskStorage({
  destination: ( req, file, cb ) => {
    cb(null, 'uploads');
  },
  filename: ( req, file, cb ) => {
    cb(null, file.originalname);
  },
});
app.use(multer({ storage: storageConfig }).single('filedata'));



app.post('/audio', ( req, res ) => {
  if ( !req.file ) {
    return res.status(400).send({
      message: 'An error has occurred while uploading the file',
    }).end();
  }

  let { start, stop } = req.query;
  start = Number(start);
  stop = Number(stop);

  const filePath = req.file.path;
  if ( start >= stop ) {
    res.status(400).send('start must be less than stop');
  }

  ffmpeg(filePath)
    .setFfmpegPath(pathToFfmpeg)
    .setFfprobePath(ffprobe.path)
    .output(filePath)
    .setStartTime(start * 1000)
    .setDuration(stop * 1000 - start * 1000)
    .withAudioCodec('copy')
    .on('end', function( err ) {
      if ( !err ) {
        console.log('conversion Done');
        res.status(200).sendFile(path.join(__dirname, filePath));
      }
    })
    .on('error', function( err ) {
      res.status(400).send({
        message: 'An error has occurred while changing the file',
      }).end();
    })
    .run();
});


app.use(express.static(path.join(__dirname, 'src')));
app.listen(PORT, () => {
  console.log(`The server is running on port:${ PORT }...`);
});