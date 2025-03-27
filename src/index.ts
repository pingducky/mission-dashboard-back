import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { Secret } from 'jsonwebtoken';
import { setupSwagger } from '../swagger';

const app = express();
setupSwagger(app);

export const SECRET_KEY: Secret = process.env.SECRET_KEY || "";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const authRoutes = require('./routes/authRoutes');
const missionRoutes = require('./routes/MissionRoutes')
const employeeRoutes = require('./routes/employeeRoutes');
const permissionRoutes = require('./routes/permissionRoutes')

app.use('/api/auth', authRoutes);
app.use('/api/employee', employeeRoutes)
app.use('/api/mission', missionRoutes)
app.use('/api/permission', permissionRoutes)

const port = process.env.NODE_ENV === 'test' ? 0 : 3000;

app.listen(port, () => {
    console.log(`Serveur TypeScript en cours d'exécution sur http://localhost:${port}`);
});

export default app