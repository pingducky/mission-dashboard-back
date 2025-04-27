import { Sequelize } from "sequelize";
import * as dotenv from "dotenv";

// Charger le fichier .env en fonction de NODE_ENV
dotenv.config({
  path: process.env.NODE_ENV === "test" ? ".env.test" : ".env.development",
});

const sequelize = new Sequelize(
    process.env.DB_NAME!,
    process.env.DB_USER!,
    process.env.DB_PASSWORD!,
    {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || "3306"),
      dialect: "mysql",
      logging: console.log,
    }
);
export default sequelize;