import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize";
import MissionTypeModel from "./MissionTypeModel";
import PictureModel from "./PictureModel";

class MissionModel extends Model {
    public id!: number;
    public description!: string;
    public timeBegin!: Date;
    public timeEnd?: Date;
    public estimatedEnd?: Date;
    public address!: string;
    public idMissionType!: number;

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
    },
    {
        sequelize,
        tableName: 'mission',
        timestamps: false,
    }
);

// ✅ Définir la relation One-To-Many avec PictureModel
MissionModel.hasMany(PictureModel, {
    foreignKey: 'idMission',
    as: 'pictures',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

PictureModel.belongsTo(MissionModel, {
    foreignKey: 'idMission',
    as: 'mission'
});

export default MissionModel;