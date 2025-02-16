import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize";

class AccountMissionAssign extends Model {
    public idAccount!: number;
    public idMission!: number;
}

AccountMissionAssign.init(
    {
        idAccount: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        idMission: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
    },
    {
        sequelize,
        tableName: 'account_mission_assign',
        timestamps: false,
    }
);