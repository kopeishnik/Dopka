const http = require('http')
const ffmpeg = require('fluent-ffmpeg')

const server = http.createServer((req, res) => {
    if (req.method === 'POST') {
        res.contentType('audio/mp3')
        res.attachment('output.mp3')
        req.files.mp3.mv('tmp/' + req.files.mp3.name, function(err) {
            if (err) return res.sendStatus(500).send(err)
        })

        //trim here

        //return then
    }
    else {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ message: 'Cannot do this' }))
    }
})

const PORT =  process.env.PORT || 5000

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))

module.exports = server;