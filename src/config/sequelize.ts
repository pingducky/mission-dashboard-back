import { Sequelize } from "sequelize";

const sequelize = new Sequelize({
    database: "MissionDashboard",
    username: "root",
    password: "Not24get",
    dialect: "mysql",
    host: "localhost",
    port: 3307,   
  });
  
  export default sequelize;