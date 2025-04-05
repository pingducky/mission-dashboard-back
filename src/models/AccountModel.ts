import {Model, DataTypes} from 'sequelize';
import sequelize from "../config/sequelize";
import MissionModel from "./MissionModel";
import AccountMissionAssignModel from "./AccountMissionAssignModel";
import RoleModel from "./RoleModel";
import AccountRoleModel from "./AccountRoleModel";
import MessageModel from "./MessageModel";

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

    static associate(models: any) {
        AccountModel.belongsToMany(MissionModel, {
            through: AccountMissionAssignModel,
            foreignKey: 'idAccount',
            otherKey: 'idMission',
            as: 'missions'
        });

        AccountModel.belongsToMany(RoleModel, {
            through: AccountRoleModel,
            foreignKey: 'accountId'
        });

        AccountModel.hasMany(MessageModel, {
            foreignKey: 'idAccount',
            as: 'messages'
        });
    }
}

AccountModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        phoneNumber: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING,
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
