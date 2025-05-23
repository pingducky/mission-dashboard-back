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
    public hiringDate!: Date;
    public delay!: number;
    public absence!: number;
    public isGpsTrackingAllowed!: boolean;
    public notificationMail!: boolean;
    public notificationSms!: boolean;
    public archivedAt!: Date | null;
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
        archivedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
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
