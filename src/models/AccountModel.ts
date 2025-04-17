import {Model, DataTypes, Sequelize} from 'sequelize';
import sequelize from "../config/sequelize";
import MessageModel from "./MessageModel";

class AccountModel extends Model {
    public id!: number;
    public firstName!: string;
    public lastName!: string;
    public password!: string;
    public phoneNumber!: string;
    public email!: string;
    public address!: string;
    public city!: string;
    public postalCode!: string;
    public hiringDate!: Date;
    public delay!: number;
    public absence!: number;
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
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        city: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        postalCode: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        hiringDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        delay: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        absence: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
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
        isOnline: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        sequelize,
        tableName: 'account',
        timestamps: false,
    }
);

export default AccountModel;
