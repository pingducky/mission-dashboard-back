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
    public city!: string;
    public postalCode!: string;
    public countryCode!: string;
    public isGpsTrackingAllowed!: boolean;
    public notificationMail!: boolean;
    public notificationSms!: boolean;
    public isEnabled!: boolean;
    public isOnline!: boolean;
    public isAdmin!: boolean; 
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
        city: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        postalCode: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        countryCode: {
            type: DataTypes.STRING(10),
            allowNull: true,
        },
        isGpsTrackingAllowed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
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
        isAdmin: {
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
