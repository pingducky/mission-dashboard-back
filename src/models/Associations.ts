import MessageModel from "./MessageModel";

export default function defineAssociations() {
    const MissionModel = require('./MissionModel').default;
    const AccountModel = require('./AccountModel').default;
    const MissionTypeModel = require('./MissionTypeModel').default;
    const PictureModel = require('./PictureModel').default;
    const AccountMissionAssignModel = require('./AccountMissionAssignModel').default;

    // Relation One-to-One entre Mission et MissionType
    MissionModel.belongsTo(MissionTypeModel, {
        foreignKey: 'idMissionType',
        as: 'missionType'
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

    // ✅ Relation Many-to-Many entre Mission et Account
    MissionModel.belongsToMany(AccountModel, {
        through: AccountMissionAssignModel,
        foreignKey: 'idMission',
        otherKey: 'idAccount',
        as: 'assignedAccounts'
    });

    AccountModel.belongsToMany(MissionModel, {
        through: AccountMissionAssignModel,
        foreignKey: 'idAccount',
        otherKey: 'idMission',
        as: 'missions'
    });

    // ✅ Relation One-to-Many entre Message et Picture
    PictureModel.belongsTo(MessageModel, {
        foreignKey: 'idMessage',
        as: 'message',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });
}