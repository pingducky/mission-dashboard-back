import { DataTypes, Model } from "sequelize";
import sequelize from '../config/sequelize';

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
        },
        idMission: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'message',
        timestamps: false,
    }
);

export default MessageModel;