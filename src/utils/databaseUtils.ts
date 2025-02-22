import sequelize from "../config/sequelize";

// Fonction pour initialiser la base de données
export const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connexion à la base de données réussie.");
    await sequelize.sync({ alter: false, logging: false });
    console.log("Base de données synchronisée.");
  } catch (error) {
    console.error("Erreur lors de l'initialisation de la base de données :", error);
  }
};

// Fonction pour réinitialiser toutes les tables
export const resetDatabase = async () => {
  try {
    await sequelize.sync({ force: true, logging: false });
    console.log("Base de données réinitialisée.");
  } catch (error) {
    console.error("Erreur lors de la réinitialisation de la base de données :", error);
  }
};

// Réinitialiser une table spécifique
export const resetTable = async (tableName: string) => {
  try {
    const model = sequelize.models[tableName];

    if (!model) {
      throw new Error(`Le modèle ${tableName} n'existe pas.`);
    }

    await model.drop(); // Supprime la table
    await model.sync(); // Recrée la table
    console.log(`Table ${tableName} réinitialisée avec succès.`);
  } catch (error) {
    console.error(`Erreur lors de la réinitialisation de ${tableName} :`, error);
  }
}