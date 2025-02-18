import AccountModel from '../models/AccountModel';

class EmployeService {
    static async disableEmployee(id: number) {
        const employee = await AccountModel.findByPk(id);
        if (employee) {
            await employee.update({ isEnabled: false });
            return employee;
        }
        return null;
    }
}

export default EmployeService;