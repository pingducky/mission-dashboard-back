import AccountModel from '../models/AccountModel';

class EmployeeService {
    static async getAllEmployees() {
        return await AccountModel.findAll();
    }

    static async getEmployeeById(id: number) {
        return await AccountModel.findByPk(id);
    }

    static async updateEmployee(id: number, updateData: object) {
        const employee = await AccountModel.findByPk(id);
        if (employee) {
            await employee.update(updateData);
            return employee;
        }
        return null;
    }
}

export default EmployeeService;