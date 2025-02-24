import { DataTypes, Model } from "sequelize";
import sequelize from '../config/sequelize';
import MessageModel from "./MessageModel";
import MissionModel from "./MissionModel";

class PictureModel extends Model {
    public id!: number;
    public name!: string;
    public alt?: string;
    public path!: string;
    public idMessage?: number | null;
    public idMission?: number | null;
}

PictureModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        alt: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        path: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        idMessage: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: MessageModel,
                key: 'id',
            },
        },
        idMission: {
            type: DataTypes.INTEGER,
            allowNull: true, 
            references: {
                model: MissionModel,
                key: 'id',
            },
        },
    },
    {
        sequelize,
        tableName: 'picture',
        timestamps: false,
    }
);

export default PictureModel;
