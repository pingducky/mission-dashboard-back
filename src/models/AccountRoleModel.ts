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
        IdAccount: {
            type: DataTypes.INTEGER,
            references: {
                model: AccountModel,
                key: 'id',
            },
        },
        IdRole: {
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

AccountModel.belongsToMany(RoleModel, { through: AccountRoleModel, foreignKey: 'accountId' });
RoleModel.belongsToMany(AccountModel, { through: AccountRoleModel, foreignKey: 'roleId' });

export default AccountRoleModel;