import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';
import AccountModel from './AccountModel';
import RoleModel from './RoleModel';

class AccountRoleModel extends Model {
    public accountId!: number;
    public idRole!: number;
}

AccountRoleModel.init(
    {
        idAccount: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: AccountModel,
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
        tableName: 'account_role',
        timestamps: false,
    }
);
AccountRoleModel.belongsTo(AccountModel, { foreignKey: 'idAccount' });
AccountRoleModel.belongsTo(RoleModel, { foreignKey: 'idRole' });

AccountModel.belongsToMany(RoleModel, { through: AccountRoleModel, foreignKey: 'idAccount' });
AccountModel.hasMany(AccountRoleModel, { foreignKey: 'idAccount' });

RoleModel.belongsToMany(AccountModel, { through: AccountRoleModel, foreignKey: 'idRole' });
RoleModel.hasMany(AccountRoleModel, { foreignKey: 'idRole' });

export default AccountRoleModel;