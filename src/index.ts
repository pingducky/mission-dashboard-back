import * as dotenv from 'dotenv';

// Définir dynamiquement quel .env charger
const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env';
dotenv.config({ path: envFile });

import app from './app';

const port = process.env.NODE_ENV === 'test' ? 0 : Number(process.env.PORT) || 3000;

app.listen(port, '0.0.0.0', () => {
    console.log(`Serveur TypeScript en cours d'exécution sur http://localhost:${port}`);
});