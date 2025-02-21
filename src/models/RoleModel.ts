import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

class RoleModel extends Model {
    public id!: number;
    public shortLibel!: string;
    public LongLibel!: string;
}

RoleModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        shortLibel: {
            type: DataTypes.STRING(10),
            allowNull: false,
        },
        longLibel: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'role',
        timestamps: false,
    }
);

export default RoleModel;