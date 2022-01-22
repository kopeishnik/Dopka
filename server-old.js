//const http = require('http')
// const ffmpeg = require('fluent-ffmpeg')
// import audioBufferSlice from 'audiobuffer-slice';

import http from 'http';
import ffmpeg from 'fluent-ffmpeg';
import pathToFfmpeg from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';
import { randomUUID } from 'crypto';

const server = http.createServer((req, res) => {
    if (req.method === 'POST') {
        const fname = `${os.tmpdir()}/${randomUUID()}.mp3`
        req.files.mp3.mv(fname, function(error) {
            if (error) return res.sendStatus(500).send(err)
        })

        if (req.start < req.stop) {
            res.sendStatus(400).send("start must be less than stop")
        }
        else {
            ffmpeg(fname)
                .setFfmpegPath(pathToFfmpeg)
                .setFfprobePath(ffprobe.path)
                .output(fname)
                .setStartTime(req.start)
                .setDuration(req.stop - req.start)
                .withAudioCodec('copy')
                .on('end', function (err) {
                    if (!err) {
                        console.log('conversion Done');
                        resolve();
                    }
                })
                .on('error', function (err) {
                    console.log('error: ', err);
                    reject(err);
                })
                .run();
        }
        res.attachment(fname)
        res.setHeader('Content-type', 'text/plain');
        res.contentType('audio/mp3')
    }
    else {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ message: 'Cannot do this' }))
    }
})

const PORT =  process.env.PORT || 5000

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))

module.exports = server;
