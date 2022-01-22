import express from 'express';
import path from 'path';
import { config } from 'dotenv';

import ffmpeg from 'fluent-ffmpeg';
import pathToFfmpeg from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';

import { randomUUID } from 'crypto';

config();

const PORT = process.env.PORT || 5000;

const app = express();
const __dirname = path.resolve();


app.get('/audio', ( req, res ) => {
  res.status(200).send({
    message: 'Hello from audio',
  });
});

app.post('/audio', ( req, res ) => {
  const fname = `${os.tmpdir()}/${randomUUID()}.mp3`

  if (req.start < req.stop) {
    res.sendStatus(400).send("start must be less than stop")
  }

  ffmpeg(fname)
    .setFfmpegPath(pathToFfmpeg)
    .setFfprobePath(ffprobe.path)
    .output(fname)
    .setStartTime(req.start)
    .setDuration(req.stop - req.start)
    .withAudioCodec('copy')
    .on('end', function (err) {
      if (!err) {
          console.log("conversion Done");
          res.sendStatus(200).send("nice");
          resolve();
      }
    })
    .on('error', function (err) {
      res.sendStatus(400).send(err);
      reject(err);
    })
    .run();

  res.status(200).send({
    
  });
});

app.use(express.static(path.join(__dirname, 'src')));

app.listen(PORT, () => {
  console.log(`The server is running on port:${ PORT }...`);
});
