import sequelize from "../config/sequelize";

// Fonction pour initialiser ou réinitialiser toutes les tables
export const resetDatabase = async () => {
  try {
    await sequelize.sync({ force: true, logging: false });
    // console.log("Base de données réinitialisée.");
  } catch (error) {
    console.error("Erreur lors de la réinitialisation de la base de données :", error);
  }
}