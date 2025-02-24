import { DataTypes, Model } from "sequelize";
import sequelize from '../config/sequelize';
import AccountModel from "./AccountModel";
import MissionModel from "./MissionModel";

class MessageModel extends Model {
    public id!: number;
    public message!: string;
    public idAccount!: number;
    public idMission!: number;
}

MessageModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        idAccount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: AccountModel,
                key: 'id',
            },
        },
        idMission: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: MissionModel,
                key: 'id',
            },
        },
    },
    {
        sequelize,
        tableName: 'message',
        timestamps: false,
    }
);

export default MessageModel;