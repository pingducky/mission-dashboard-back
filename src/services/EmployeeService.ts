import AccountModel from '../models/AccountModel';

class EmployeeService {
    // Récupérer tous les employés (par exemple, utiliser findAll pour tous les résultats)
    static async getAllEmployees() {
        return await AccountModel.findAll(); // Renvoie tous les employés
    }

    // Récupérer un employé par son ID
    static async getEmployeeById(id: number) {
        return await AccountModel.findByPk(id); // Utilise findByPk pour rechercher par ID
    }

    // Mettre à jour un employé
    static async updateEmployee(id: number, updateData: object) {
        const employee = await AccountModel.findByPk(id);
        if (employee) {
            // Mettre à jour les informations de l'employé et renvoyer l'employé mis à jour
            await employee.update(updateData);
            return employee; // Retourner l'employé mis à jour
        }
        return null; // Retourner null si l'employé n'est pas trouvé
    }
}

export default EmployeeService;