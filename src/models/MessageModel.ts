import { DataTypes, Model } from "sequelize";
import sequelize from '../config/sequelize';
import AccountModel from "./AccountModel";

class MessageModel extends Model {
    public id!: number;
    public message!: string;
    public idAccount!: number;
    public idMission!: number;
}

MessageModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        idAccount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: AccountModel,
                key: 'id',
            },
        },
        idMission: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "mission",
                key: 'id',
            },
        },
    },
    {
        sequelize,
        tableName: 'message',
        timestamps: true,
    }
);

MessageModel.belongsTo(AccountModel, {
    foreignKey: "idAccount",
    as: "author",
});


const MissionModel = require("./MissionModel").default;

// Sécurité : ne fait l’association que si le modèle est bien chargé
if (MissionModel && MissionModel.prototype instanceof Model) {
    setImmediate(() => {
        MessageModel.belongsTo(MissionModel, {
            foreignKey: "idMission",
            as: "mission",
        });
    });
} else {
    console.warn("[WARN] MissionModel not ready — skipping MessageModel.belongsTo(MissionModel)");
}


export default MessageModel;