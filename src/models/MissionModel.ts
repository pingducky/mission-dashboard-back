import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize";

class MissionModel extends Model {
    public id!: number;
    public description!: string;
    public timeBegin!: Date;
    public estimatedEnd?: Date;
    public address!: string;
    public limit?: Date;
    public idMissionType!: number;
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
        limit: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        idMissionType: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'mission',
        timestamps: false,
    }
);