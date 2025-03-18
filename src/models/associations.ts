// src/models/associations.ts
import MessageModel from "./MessageModel";

export default function defineAssociations() {
    const MissionModel = require('./MissionModel').default;
    const AccountModel = require('./AccountModel').default;
    const MissionTypeModel = require('./MissionTypeModel').default;
    const PictureModel = require('./PictureModel').default;
    const AccountMissionAssignModel = require('./AccountMissionAssignModel').default;

    // Define associations after all models are loaded
    MissionModel.belongsTo(MissionTypeModel, {
        foreignKey: 'idMissionType',
        as: 'missionType'
    });

    MissionModel.hasMany(PictureModel, {
        foreignKey: 'idMission',
        as: 'pictures'
    });

    MissionModel.belongsToMany(AccountModel, {
        through: AccountMissionAssignModel,
        foreignKey: 'idMission',
        otherKey: 'idAccount',
        as: 'assignedAccounts'  // Ajout de l'alias explicite
    });

    AccountModel.belongsToMany(MissionModel, {
        through: AccountMissionAssignModel,
        foreignKey: 'idAccount',
        otherKey: 'idMission',
        as: 'missions'  // Ajout d'un alias explicite
    });

    // ✅ Relation One-to-Many entre Mission et Picture
    MissionModel.hasMany(PictureModel, {
        foreignKey: 'idMission',
        as: 'pictures',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });

    PictureModel.belongsTo(MissionModel, {
        foreignKey: 'idMission',
        as: 'linkedMission'
    });

    // ✅ Relation One-to-Many entre Message et Picture
    PictureModel.belongsTo(MessageModel, {
        foreignKey: 'idMessage',
        as: 'message',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });
}