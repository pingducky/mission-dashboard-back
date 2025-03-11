import { Request, Response } from 'express';
import EmployeService from '../services/EmployeService';
import { ErrorEnum } from '../enums/errorEnum';
import EmployeRepository from '../repositories/EmployeRepository';
import { handleHttpError } from '../services/ErrorService';
import { BadRequestError } from '../Errors/BadRequestError';
import { isValidEmail } from '../services/Email';

export const updateEmployeRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const { roleId, add } = req.body;
        const employeId = parseInt(req.params.id, 10);

        if ( !employeId || !roleId || typeof add != 'boolean') {
          throw new Error(ErrorEnum.MISSING_REQUIRED_FIELDS);
        }

        const executed = await EmployeService.updateEmployeRole(employeId, roleId, add);

        res.status(200).json({ executed });
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(400).json({ error: ErrorEnum.UNEXPECTED_ERROR });
        }
    }
};


export const getAllEmployees = async (req: Request, res: Response): Promise<void> => {
    try {
        const employees = await EmployeRepository.getAll();
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

        const employee = await EmployeRepository.getById(numericId);

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
            throw new BadRequestError(ErrorEnum.ACCOUNT_NOT_FOUND);
        }

        if (!updateData || Object.keys(updateData).length === 0) {
            throw new BadRequestError(ErrorEnum.UPDATE_EMPTY);
        }

        if (updateData.email && !isValidEmail(updateData.email)) {
            throw new BadRequestError(ErrorEnum.UPDATE_EMPTY);
        }

        const updatedEmployee = await EmployeRepository.update(numericId, updateData);

        if (!updatedEmployee) {
            res.status(404).json({ error: ErrorEnum.ACCOUNT_NOT_FOUND });
            return;
        }

        res.status(200).json(updatedEmployee);
        return;
    } catch (error: unknown) {
        handleHttpError(error, res);
    }
};
