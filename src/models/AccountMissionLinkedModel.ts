import {DataTypes, Model} from "sequelize";
import sequelize from "../config/sequelize";
import AccountModel from "./AccountModel";
import MissionModel from "./MissionModel";

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
            references: {model: 'account', key: 'id',}

        },
        idMission: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {model: 'mission', key: 'id',}
        },
        idClocking: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            // Todo : Ajouter la contrainte référence lorsque ClockingModel sera créé.
        },
        spentTime: {
            type: DataTypes.DECIMAL(5, 2),
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

