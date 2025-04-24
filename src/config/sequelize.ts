import { Sequelize } from "sequelize";
import * as dotenv from "dotenv";

// Charger le fichier .env en fonction de NODE_ENV
dotenv.config({
  path: process.env.NODE_ENV === "test" ? ".env.test" : ".env.development",
});

const sequelize = new Sequelize({
  database: process.env.DB_DATABASE,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  dialect: "mysql",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "3306"),
  logging: console.log, // Supprimer cette ligne pour avoir moins de logs
});

export default sequelize;
