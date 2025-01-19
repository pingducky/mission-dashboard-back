import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import router from './routes/Routes';
import { Secret } from 'jsonwebtoken';

const app = express();

export const SECRET_KEY: Secret = process.env.SECRET_KEY || "";

app.use(bodyParser.json());
//parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// const Sequelize = require("sequelize");
// initialize an instance of Sequelize
// const sequelize = new Sequelize({
//   database: "MissionDashboard",
//   username: "root",
//   password: "Not24get",
//   dialect: "mysql",
//   host: "localhost",
//   port: 3307,   
// });
// check the databse connection
// sequelize
//   .authenticate()
//   .then(() => console.log("Connection has been established successfully."))
//   .catch((err: unknown) => {
//     if (err instanceof Error) {
//       console.error("Unable to connect to the database:", err.message);
//     } else {
//       console.error("An unexpected error occurred:", err);
//     }
//   });

app.use('/api', router);

app.listen(3000, () => {
    console.log(`Serveur TypeScript en cours d'exécution sur http://localhost:${3000}`);
});

