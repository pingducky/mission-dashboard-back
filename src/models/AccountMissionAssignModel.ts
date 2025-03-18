import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize";
import AccountModel from "./AccountModel";
import MissionModel from "./MissionModel";

class AccountMissionAssignModel extends Model {
    public idAccount!: number;
    public idMission!: number;
}

AccountMissionAssignModel.init(
    {
        idAccount: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: { model: AccountModel, key: 'id', }
        },
        idMission: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: { model: MissionModel, key: 'id', }
        },
    },
    {
        sequelize,
        tableName: 'account_mission_assign',
        timestamps: false,
    }
);

export default AccountMissionAssignModel;
