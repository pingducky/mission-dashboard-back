import AccountModel from './AccountModel';
import AccountMissionAssignModel from './AccountMissionAssignModel';
import AccountRoleModel from './AccountRoleModel';
import MessageModel from './MessageModel';
import MissionModel from './MissionModel';
import MissionTypeModel from './MissionTypeModel';
import PictureModel from './PictureModel';
import RoleModel from './RoleModel';
import AccountMissionLinkedModel from './AccountMissionLinkedModel';

const models = {
    AccountModel,
    AccountMissionAssignModel,
    AccountRoleModel,
    MessageModel,
    MissionModel,
    MissionTypeModel,
    PictureModel,
    RoleModel,
    AccountMissionLinkedModel
};

//Permet de configurer les associations sans provoquer d'import circulaire.
Object.values(models).forEach((model: any) => {
    if (typeof model.associate === 'function') {
        model.associate(models);
    }
});

export default models;