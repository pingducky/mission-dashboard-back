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
                key: 'Id',
            },
        },
        IdRole: {
            type: DataTypes.INTEGER,
            references: {
                model: RoleModel,
                key: 'Id',
            },
        },
    },
    {
        sequelize,
        tableName: 'has',
        timestamps: false,
    }
)

AccountModel.belongsToMany(RoleModel, { through: AccountRoleModel, foreignKey: 'IdAccount' });
RoleModel.belongsToMany(AccountModel, { through: AccountRoleModel, foreignKey: 'IdRole' });

export default AccountRoleModel;