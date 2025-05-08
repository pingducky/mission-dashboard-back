import { ErrorEnum } from "../../enums/errorEnum";
import { NotFoundError } from "../../Errors/NotFoundError";
import AccountModel from "../../models/AccountModel";
import AccountRoleModel from "../../models/AccountRoleModel";
import RoleModel from "../../models/RoleModel";

class EmployeService {
    static async updateEmployeRole(employeId: number, roleId: number, add: boolean): Promise<any | null> {
        const employe = await AccountModel.findByPk(employeId);

        if (!employe) {
            throw new NotFoundError(ErrorEnum.ACCOUNT_NOT_FOUND);
        }

        const role = await RoleModel.findByPk(roleId);


        if (!role) {
            throw new NotFoundError(ErrorEnum.ROLE_NOT_FOUND);
        }

        if(add) {
            return await AccountRoleModel.findOrCreate({
                where: {
                    idAccount: employeId,
                    idRole: roleId,
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