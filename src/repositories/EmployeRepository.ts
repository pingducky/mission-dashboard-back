import AccountModel from '../models/AccountModel';
import {ErrorEnum} from "../enums/errorEnum";
import { NotFoundError } from '../Errors/NotFoundError';

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
}

export default EmployeRepository;