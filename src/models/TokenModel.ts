import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';
import AccountModel from './AccountModel';

class TokenModel extends Model {
    public id!: number;
    public token!: string;
    public isValid!: boolean;
}

TokenModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        token: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        isValid: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
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
        tableName: 'token',
        timestamps: false,
    }
);

export default TokenModel;