import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize";
import PermissionModel from "./PermissionModel";
import RoleModel from "./RoleModel";

class PermissionRoleModel extends Model {
    public idPermission!: number;
    public idRole!: number;
}

PermissionRoleModel.init(
    {
        idPermission: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: PermissionModel,
                key: 'id',
            },
        },
        idRole: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: RoleModel,
                key: 'id',
            },
        },
    },
    {
        sequelize,
        tableName: 'permission_role',
        timestamps: false,
    }
);


PermissionRoleModel.belongsTo(PermissionModel, { foreignKey: 'idPermission' });
PermissionRoleModel.belongsTo(RoleModel, { foreignKey: 'idRole' });

PermissionModel.belongsToMany(RoleModel, { through: PermissionRoleModel, foreignKey: 'idPermission' });
PermissionModel.hasMany(PermissionRoleModel, { foreignKey: 'idPermission' });

RoleModel.belongsToMany(PermissionModel, { through: PermissionRoleModel, foreignKey: 'idRole' });
RoleModel.hasMany(PermissionRoleModel, { foreignKey: 'idRole' });

export default PermissionRoleModel;