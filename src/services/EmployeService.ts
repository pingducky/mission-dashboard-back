import AccountModel from '../models/AccountModel';
import { ErrorEnum } from '../enums/errorEnum';
import AccountRoleModel from '../models/AccountRoleModel';
import RoleModel from '../models/RoleModel';

class EmployeService {
    static async updateEmployeRole(employeId: number, roleId: number, add: boolean): Promise<any | null> {
        const employe = await AccountModel.findByPk(employeId);

        if (!employe) {
            throw new Error(ErrorEnum.ACCOUNT_NOT_FOUND);
        }

        const role = await RoleModel.findByPk(roleId);

        if (!role) {
            throw new Error(ErrorEnum.ROLE_NOT_FOUND);
        }

        if(add) {
            return await AccountRoleModel.findOrCreate({
                where: {
                    IdAccount: employeId,
                    IdRole: roleId,
                },
            }).then(([accountRole, created]) => {
                return created;
            });
        }

        return await AccountRoleModel.destroy({
            where: {
                IdAccount: employeId,
                IdRole: roleId,
            },
        }) > 0;
    }
}

export default EmployeService;