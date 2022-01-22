//const http = require('http')
// const ffmpeg = require('fluent-ffmpeg')

import http from 'http';
var audioBufferSlice = require('audiobuffer-slice');

const server = http.createServer((req, res) => {
    if (req.method === 'POST') {
        var fname = `tmp/${req.files.mp3.name}`
        req.files.mp3.mv(fname, function(error) {
            if (error) return res.sendStatus(500).send(err)
        })

        if (req.start < req.stop) {
            res.sendStatus(400).send("start must be less than stop")
        }
        else {
            audioBufferSlice(fname, req.start, req.stop, function(error, slicedAudioBuffer) {
                if (error) {
                  console.error(error);
                } else {
                  source.buffer = slicedAudioBuffer;
                }
            });
        }
        res.attachment('output.mp3')
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