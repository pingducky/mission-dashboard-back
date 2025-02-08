import { Model, DataTypes, Sequelize } from 'sequelize';
import AccountModel from './AccountModel';
import sequelize from "../config/sequelize";

class RoleModel extends Model {
    public id!: number;
    public shortLibel!: string;
    public longLibel!: string;
}

    RoleModel.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            shortLibel: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            longLibel: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            sequelize,
            tableName: 'roles',
            timestamps: false,
        }
    );

    // Relations
    RoleModel.belongsToMany(AccountModel, { through: 'HaveRole', foreignKey: 'roleId' }); // Many-to-Many avec Account

export default RoleModel;