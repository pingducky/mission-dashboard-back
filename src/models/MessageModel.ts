import {DataTypes, Model} from "sequelize";
import sequelize from '../config/sequelize';
import AccountModel from "./AccountModel";
import MissionModel from "./MissionModel";
import PictureModel from "./PictureModel";

class MessageModel extends Model {
    public id!: number;
    public message!: string;
    public idAccount!: number;
    public idMission!: number;
    public account?: AccountModel;
    public mission?: MissionModel;

    static associate(models: any) {
        MessageModel.belongsTo(AccountModel, {
            foreignKey: 'idAccount',
            as: 'account'
        });

        MessageModel.belongsTo(MissionModel, {
            foreignKey: 'idMission',
            as: 'mission'
        });

        MessageModel.hasMany(PictureModel, {
            foreignKey: 'idMessage',
            as: 'pictures'
        });
    }
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
                model: 'account',
                key: 'id',
            },
        },
        idMission: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'mission',
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