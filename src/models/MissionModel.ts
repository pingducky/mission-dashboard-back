import {DataTypes, Model} from "sequelize";
import sequelize from "../config/sequelize";
import MissionTypeModel from "./MissionTypeModel";
import PictureModel from "./PictureModel";
import AccountModel from "./AccountModel";
import AccountMissionAssignModel from "./AccountMissionAssignModel";
import MessageModel from "./MessageModel";

class MissionModel extends Model {
    public id!: number;
    public description!: string;
    public timeBegin!: Date;
    public timeEnd?: Date;
    public estimatedEnd?: Date;
    public address!: string;
    public idMissionType!: number;
    public pictures?: PictureModel[];

    static associate(models: any) {
        MissionModel.belongsTo(MissionTypeModel, {
            foreignKey: 'idMissionType',
            as: 'missionType'
        });

        MissionModel.hasMany(PictureModel, {
            foreignKey: 'idMission',
            as: 'pictures',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });

        MissionModel.belongsToMany(AccountModel, {
            through: AccountMissionAssignModel,
            foreignKey: 'idMission',
            otherKey: 'idAccount',
            as: 'assignedAccounts'
        });

        MissionModel.hasMany(MessageModel, {
            foreignKey: 'idMission',
            as: 'messages'
        });
    }
}

MissionModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        timeBegin: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        estimatedEnd: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        timeEnd: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        idMissionType: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'mission_type',
                key: 'id',
            },
        },
    },
    {
        sequelize,
        tableName: 'mission',
        timestamps: false,
    }
);

export default MissionModel;