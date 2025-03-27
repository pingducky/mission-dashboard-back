import MissionModel from './MissionModel';
import MessageModel from './MessageModel';
import PictureModel from './PictureModel';
import MissionTypeModel from './MissionTypeModel';
import RoleModel from './RoleModel';
import AccountMissionAssignModel from './AccountMissionAssignModel';
import AccountMissionLinked from "./AccountMissionLinkedModel";
import AccountRoleModel from './AccountRoleModel';
import sequelize from "../config/sequelize";
import AccountModel from "./AccountModel";
import defineAssociations from "./Associations";

const initModels = async () => {
    try {
        // ✅ 1. Définir les relations APRÈS la synchronisation complète
        console.log('🔗 Configuration des relations...');

        defineAssociations();

        console.log('🚀 Toutes les relations sont créées avec succès !');

        // ✅ 2. Synchroniser d'abord les modèles indépendants dans le bon ordre
        await AccountModel.sync({ alter: true });
        console.log('✅ Table Account synchronisée');

        await MissionTypeModel.sync({ alter: true });
        console.log('✅ Table MissionType synchronisée');

        await RoleModel.sync({ alter: true });
        console.log('✅ Table Role synchronisée');

        await MissionModel.sync({ alter: true });
        console.log('✅ Table Mission synchronisée');

        await MessageModel.sync({ alter: true });
        console.log('✅ Table Message synchronisée');

        await PictureModel.sync({ alter: true });
        console.log('✅ Table Picture synchronisée');

        await AccountMissionAssignModel.sync({ alter: true });
        console.log('✅ Table AccountMissionAssign synchronisée');

        await AccountMissionLinked.sync({ alter: true });
        console.log('✅ Table AccountMissionLinked synchronisée');

        await AccountRoleModel.sync({ alter: true });
        console.log('✅ Table AccountRole synchronisée');

        await AccountMissionAssignModel.sync({ alter: true });

    } catch (error) {
        console.error('❌ Erreur lors de la synchronisation des tables :', error);
    }
};

export default initModels;