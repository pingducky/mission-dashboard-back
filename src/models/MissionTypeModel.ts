import { DataTypes, Model } from "sequelize";
import sequelize from '../config/sequelize';

class MissionTypeModel extends Model {
    public id!: number;
    public shortLibel!: string;
    public longLibel!: string;
}

MissionTypeModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        shortLibel: {
            type: DataTypes.STRING(10),
            allowNull: false,
        },
        longLibel: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'mission_type',
        timestamps: false,
    }
);