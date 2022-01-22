import express from 'express';
import path from 'path';
import { config } from 'dotenv';

config();

const PORT = process.env.PORT || 5000;

const app = express();
const __dirname = path.resolve();


app.get('/audio', ( req, res ) => {
  res.status(200).send({
    message: 'Hello from audio',
  });
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
