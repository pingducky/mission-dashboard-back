import { Model, DataTypes } from 'sequelize';
import sequelize from "../config/sequelize";
import AccountModel from './AccountModel';

class FileModel extends Model {
    public id!: number;
    public path!: string;
    public name!: string;
    public size!: string;
    public idAccount!: number;
}

FileModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        path: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        size: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        idAccount: {
            type: DataTypes.INTEGER,
            references: {
                model: AccountModel,
                key: 'id',
            },
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'file',
        timestamps: false,
    }
);

export default FileModel;