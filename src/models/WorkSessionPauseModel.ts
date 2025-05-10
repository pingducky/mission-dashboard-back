import {DataTypes, Model} from "sequelize";
import WorkSessionModel from "./WorkSessionModel";
import sequelize from "../config/sequelize";

class WorkSessionPauseModel extends Model {
    public id!: number;
    public idWorkSession!: number;
    public pauseTime!: Date;
    public resumeTime!: Date;
}

WorkSessionPauseModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        idWorkSession: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: WorkSessionModel, key: "id" },
        },
        pauseTime: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        resumeTime: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'work_session_pause',
        timestamps: false,
    }
);

export default WorkSessionPauseModel;