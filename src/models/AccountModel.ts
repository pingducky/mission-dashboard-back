import { Model, DataTypes } from 'sequelize';
import sequelize from "../config/sequelize";

class AccountModel extends Model {
    public id!: number;
    public firstName!: string;
    public lastName!: string;
    public password!: string;
    public phoneNumber!: string;
    public email!: string;
    public address!: string;
    public notificationMail!: boolean;
    public notificationSms!: boolean;
    public isEnabled!: boolean;
}

AccountModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        firstName: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        lastName: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        phoneNumber: {
            type: DataTypes.STRING(15),
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING(320),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        address: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        notificationMail: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        notificationSms: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        isEnabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'account',
        timestamps: false,
    }
);

export default AccountModel;
