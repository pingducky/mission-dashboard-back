import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize";

class AccountMissionLinked extends Model {
    public idAccount!: number;
    public idMission!: number;
    public idClocking!: number;
    public spentTime!: number;
}

AccountMissionLinked.init(
    {
        idAccount: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        idMission: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        idClocking: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        spentTime: {
            type: DataTypes.DECIMAL(5,2),
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'account_mission_linked',
        timestamps: false,
    }
);

export default AccountMissionLinked;