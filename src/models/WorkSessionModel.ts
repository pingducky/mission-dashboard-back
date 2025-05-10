import {DataTypes, Model} from "sequelize";
import AccountModel from "./AccountModel";
import MissionModel from "./MissionModel";
import sequelize from "../config/sequelize";
import WorkSessionPauseModel from "./WorkSessionPauseModel";

export enum WorkSessionStatusEnum {
    STARTED = "started",
    PAUSED = "paused",
    ENDED = "ended"
}

class WorkSessionModel extends Model {
    public id!: number;
    public idAccount!: number;
    public idMission!: number | null;
    public startTime!: Date;
    public endTime?: Date | null;
    public status!: WorkSessionStatusEnum;

    public pauses?: {
        id: number;
        pauseTime: Date;
        resumeTime: Date | null;
    }[];
}

WorkSessionModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        idAccount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: AccountModel,
                key: "id",
            },
        },
        idMission: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: MissionModel,
                key: "id",
            },
        },
        startTime: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        endTime: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM(...Object.values(WorkSessionStatusEnum)),
            allowNull: false,
            defaultValue: WorkSessionStatusEnum.STARTED,
        }
    },
    {
        sequelize,
        tableName: "work_session",
        timestamps: false,
    }
);

WorkSessionModel.belongsTo(AccountModel, { foreignKey: "idAccount" });
WorkSessionModel.belongsTo(MissionModel, { foreignKey: "idMission" });
WorkSessionModel.hasMany(WorkSessionPauseModel, { foreignKey: "idWorkSession", as: "pauses" });
WorkSessionPauseModel.belongsTo(WorkSessionModel, { foreignKey: "idWorkSession", as: "workSession" });

export default WorkSessionModel;