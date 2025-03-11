import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';
import AccountModel from './AccountModel';
import RoleModel from './RoleModel';

class AccountRoleModel extends Model {
    public accountId!: number;
    public roleId!: number;
}

AccountRoleModel.init(
    {
        idAccount: {
            type: DataTypes.INTEGER,
            references: {
                model: AccountModel,
                key: 'id',
            },
        },
        idRole: {
            type: DataTypes.INTEGER,
            references: {
                model: RoleModel,
                key: 'id',
            },
        },
    },
    {
        sequelize,
        tableName: 'has',
        timestamps: false,
    }
)

AccountModel.belongsToMany(RoleModel, { through: AccountRoleModel, foreignKey: 'idAccount' });
RoleModel.belongsToMany(AccountModel, { through: AccountRoleModel, foreignKey: 'idRole' });

export default AccountRoleModel;