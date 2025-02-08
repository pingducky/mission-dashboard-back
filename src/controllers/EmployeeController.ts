import { Request, Response } from 'express';
import EmployeeService from '../services/EmployeeService';
import { ErrorEnum } from '../enums/errorEnum';

export const getAllEmployees = async (req: Request, res: Response): Promise<void> => {
    try {
        // Vérification si l'utilisateur est admin (exemple avec req.user.role)
        //if (req.user.role !== 'admin') {
            //throw new Error(ErrorEnum.UNAUTHORIZED);
        //}

        const employees = await EmployeeService.getAllEmployees();
        res.status(200).json(employees);
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(400).json({ error: ErrorEnum.UNEXPECTED_ERROR });
        }
    }
};

export const getEmployeeById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Vérifier si l'ID est valide et convertir en nombre
        const numericId = Number(id);
        if (isNaN(numericId)) {
            //throw new Error(ErrorEnum.INVALID_ID);
        }

        const employee = await EmployeeService.getEmployeeById(numericId);

        if (!employee) {
            res.status(404).json({ error: ErrorEnum.ACCOUNT_NOT_FOUND });
            return;
        }

        res.status(200).json(employee);
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(400).json({ error: ErrorEnum.UNEXPECTED_ERROR });
        }
    }
};


export const updateEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Vérifier si l'ID est valide et convertir en nombre
        const numericId = Number(id);
        if (isNaN(numericId) || !updateData) {
            //throw new Error(ErrorEnum.INVALID_ID);
        }

        const updatedEmployee = await EmployeeService.updateEmployee(numericId, updateData);

        if (!updatedEmployee) {
            res.status(404).json({ error: ErrorEnum.ACCOUNT_NOT_FOUND });
            return;
        }

        res.status(200).json(updatedEmployee);
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(400).json({ error: ErrorEnum.UNEXPECTED_ERROR });
        }
    }
};
