import {DataTypes, Model} from "sequelize";
import sequelize from '../config/sequelize';
import MissionModel from "./MissionModel";
import MessageModel from "./MessageModel";

class PictureModel extends Model {
    public id!: number;
    public name!: string;
    public alt?: string;
    public path!: string;
    public idMessage?: number | null;
    public idMission?: number | null;

    static associate(models: any) {
        PictureModel.belongsTo(MissionModel, {
            foreignKey: 'idMission',
            as: 'linkedMission'
        });

        PictureModel.belongsTo(MessageModel, {
            foreignKey: 'idMessage',
            as: 'message',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    }
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
                model: 'message',
                key: 'id',
            },
        },
        idMission: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'mission',
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