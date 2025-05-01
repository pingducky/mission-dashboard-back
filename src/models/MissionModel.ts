import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize";
import MissionTypeModel from "./MissionTypeModel";
import PictureModel from "./PictureModel";
import MessageModel from "./MessageModel";

class MissionModel extends Model {
    public id!: number;
    public description!: string;
    public timeBegin!: Date;
    public timeEnd?: Date;
    public estimatedEnd?: Date;
    public address!: string;
    public city!: string;
    public postalCode!: string;
    public countryCode!: string;
    public idMissionType!: number;
    public isCancelled?: boolean;
    public pictures?: PictureModel[];
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
        city: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        postalCode: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        countryCode: {
            type: DataTypes.STRING(10),
            allowNull: true,
        },
        timeEnd: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        idMissionType: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: MissionTypeModel,
                key: 'id',
            },
        },
        isCanceled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        }
    },
    {
        sequelize,
        tableName: 'mission',
        timestamps: false,
    }
);

MissionModel.hasMany(PictureModel, {
    foreignKey: 'idMission',
    as: 'pictures',
});

MissionModel.belongsTo(MissionTypeModel, {
    foreignKey: 'idMissionType',
    as: 'missionType',
});

MissionTypeModel.hasMany(MissionModel, {
    foreignKey: 'idMissionType',
    as: 'missions',
});

MessageModel.belongsTo(MissionModel, {
    foreignKey: 'idMission',
    as: 'mission'
});

MissionModel.hasMany(MessageModel, {
    foreignKey: 'idMission',
    as: 'messages',
});

PictureModel.belongsTo(MissionModel, {
    foreignKey: 'idMission',
    as: 'mission'
});

export default MissionModel;