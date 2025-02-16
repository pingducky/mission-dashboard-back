import { DataTypes, Model } from "sequelize";
import sequelize from '../config/sequelize';

class PictureModel extends Model {
    public id!: number;
    public name!: string;
    public alt?: string;
    public idMessage!: number;
    public idMission!: number;
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
        idMessage: {
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
        tableName: 'picture',
        timestamps: false,
    }
);