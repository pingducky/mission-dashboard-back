import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import router from './routes/Routes';
import { Secret } from 'jsonwebtoken';

const app = express();

export const SECRET_KEY: Secret = process.env.SECRET_KEY || "";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api', router);


const port = process.env.NODE_ENV === 'test' ? 0 : 3000;

app.listen(port, () => {
    console.log(`Serveur TypeScript en cours d'exécution sur http://localhost:${port}`);
});

export default app