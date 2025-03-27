import AccountModel from '../models/AccountModel';
import {ErrorEnum} from "../enums/errorEnum";
import { NotFoundError } from '../Errors/NotFoundError';
import AccountRoleModel from '../models/AccountRoleModel';
import RoleModel from '../models/RoleModel';
import PermissionRoleModel from '../models/PermissionRoleModel';
import PermissionModel from '../models/PermissionModel';

class EmployeRepository {
    static async getAll() {
        return await AccountModel.findAll();
    }

    static async getById(id: number) {
        return await AccountModel.findByPk(id);
    }

    static async update(id: number, updateData: object) {
        const employee = await AccountModel.findByPk(id);
        if (!employee) {
            throw new NotFoundError(ErrorEnum.ACCOUNT_NOT_FOUND);
        }
        await employee.update(updateData);

        return employee;
    }

    static async checkPermission(idAccount: number, permission: string): Promise<boolean> {
        const employee = await AccountModel.findByPk(idAccount);
        if (!employee) {
            throw new NotFoundError(ErrorEnum.ACCOUNT_NOT_FOUND);
        }

        const user = await AccountRoleModel.findOne({
            attributes: ['idRole'],
            include: [{
                model: RoleModel,
                include: [{
                    model: PermissionRoleModel,
                    include: [{
                        model: PermissionModel,
                        attributes: ['longLibel'],
                        where: {
                            longLibel: permission,
                        }
                    }]
                }]
            }],
            where: {
                idAccount: idAccount
            }
        });
        return user?.toJSON()['RoleModel']['PermissionRoleModels'][0] != null;
    }
}

export default EmployeRepository;