import sequelize from "../config/sequelize";

export const resetDatabase = async () => {
  await sequelize.sync({ force: true });
}