import {Model, DataTypes} from 'sequelize';
import sequelize from '../config/sequelize';
import AccountModel from './AccountModel';
import RoleModel from './RoleModel';

class AccountRoleModel extends Model {
    public accountId!: number;
    public roleId!: number;

    static associate(models: any) {
        AccountModel.belongsToMany(RoleModel, {
            through: 'role',
            foreignKey: 'accountId'
        });

        RoleModel.belongsToMany(AccountModel, {
            through: 'role',
            foreignKey: 'roleId'
        });
    }
}

AccountRoleModel.init(
    {
        IdAccount: {
            type: DataTypes.INTEGER,
            references: {
                model: 'role',
                key: 'id',
            },
        },
        IdRole: {
            type: DataTypes.INTEGER,
            references: {
                model: 'role',
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

export default AccountRoleModel;