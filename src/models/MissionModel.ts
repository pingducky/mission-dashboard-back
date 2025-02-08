import { Model, DataTypes, Sequelize } from 'sequelize';
import AccountModel from './AccountModel';
import {sequelize} from "../config/sequelize";

class MissionModel extends Model {
    public id!: number;
    public description!: string;
    public timeBegin!: Date;
    public estimatedEnd!: Date;
    public address!: string;
}

    MissionModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            description: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            timeBegin: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            estimatedEnd: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            address: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        },
        {
            sequelize,
            tableName: 'missions',
            timestamps: false,
        }
    );

    // Relations
    MissionModel.belongsTo(AccountModel, { foreignKey: 'accountId' }); // One-to-Many (inverse)

export default MissionModel;