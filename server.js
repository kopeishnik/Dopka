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

app.use(express.static(path.join(__dirname, 'src')));


app.listen(PORT, () => {
  console.log(`The server is running on port:${ PORT }...`);
});
