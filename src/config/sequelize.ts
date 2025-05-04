import { Sequelize } from "sequelize";
import * as dotenv from "dotenv";

// Charger en fonction de NODE_ENV correctement
const nodeEnv = process.env.NODE_ENV || "development";
const envFile = `.env.${nodeEnv}`;

dotenv.config({ path: envFile });

const sequelize = new Sequelize({
    database: process.env.DB_DATABASE!,
    username: process.env.DB_USERNAME!,
    password: process.env.DB_PASSWORD!,
    dialect: "mysql",
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT || "3306"),
});

export default sequelize;