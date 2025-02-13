import { Request, Response } from 'express';
import EmployeeService from '../services/EmployeeService';
import { ErrorEnum } from '../enums/errorEnum';

export const getAllEmployees = async (req: Request, res: Response): Promise<void> => {
    try {
        const employees = await EmployeeService.getAllEmployees();
        res.status(200).json(employees);
        return;
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

        const numericId = Number(id);
        if (isNaN(numericId)) {
            res.status(400).json({ error: ErrorEnum.ACCOUNT_NOT_FOUND });
            return;
        }

        const employee = await EmployeeService.getEmployeeById(numericId);

        if (!employee) {
            res.status(404).json({ error: ErrorEnum.ACCOUNT_NOT_FOUND });
            return;
        }

        res.status(200).json(employee);
        return;
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(400).json({ error: ErrorEnum.UNEXPECTED_ERROR });
        }
        return;
    }
};

export const updateEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const numericId = Number(id);
        if (isNaN(numericId)) {
            res.status(400).json({ error: ErrorEnum.ACCOUNT_NOT_FOUND });
            return;
        }

        if (!updateData || Object.keys(updateData).length === 0) {
            res.status(400).json({ error: ErrorEnum.UPDATE_EMPTY });
            return;
        }

        const updatedEmployee = await EmployeeService.updateEmployee(numericId, updateData);

        if (!updatedEmployee) {
            res.status(404).json({ error: ErrorEnum.ACCOUNT_NOT_FOUND });
            return;
        }

        res.status(200).json(updatedEmployee);
        return;
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(400).json({ error: ErrorEnum.UNEXPECTED_ERROR });
        }
    }
};
