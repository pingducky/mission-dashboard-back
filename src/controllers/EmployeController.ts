import { Request, Response } from 'express';
import AccountModel from '../models/AccountModel';
import { ErrorEnum } from '../enums/errorEnum';
import { CustomRequest } from '../middleware/authMiddleware';
import EmployeRepository from '../repositories/EmployeRepository';
import { handleHttpError } from '../services/ErrorService';
import { BadRequestError } from '../Errors/BadRequestError';
import { isValidEmail } from '../services/Email';
import { permissionsEnum } from '../enums/permissionsEnum';
import { NotFoundError } from '../Errors/NotFoundError';

export const disableEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
        const { user } = req as CustomRequest;

        if(!(await EmployeRepository.checkPermission(user.id, permissionsEnum.DISABLE_EMPLOYEE))){
            res.status(401).json({ error: ErrorEnum.UNAUTHORIZED });
            return;
        }


        const id = parseInt(req.params.id, 10);
        const employee = await AccountModel.findByPk(id);
        
        if (!employee) {
            res.status(400).json({ message: ErrorEnum.ACCOUNT_NOT_FOUND });
            return;
        }
        
        await employee.update({ isEnabled: false });
        res.status(204).send();
    } catch (error: unknown) {
        handleHttpError(error, res);
    }
};


export const getAllEmployees = async (req: Request, res: Response): Promise<void> => {
    try {
        const filter = req.query.status as 'all' | 'active' | 'inactive' | 'online' | undefined;
        const employees = await EmployeRepository.getAll(filter);
        res.status(200).json(employees);
    } catch (error: unknown) {
        handleHttpError(error, res);
    }
};

export const getEmployeeById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const numericId = Number(id);
        if (isNaN(numericId)) {
            throw new BadRequestError(ErrorEnum.ACCOUNT_NOT_FOUND)
        }

        const employee = await EmployeRepository.getById(numericId);

        if (!employee) {
            throw new NotFoundError(ErrorEnum.ACCOUNT_NOT_FOUND);
        }

        res.status(200).json(employee);
        return;
    } catch (error: unknown) {
        handleHttpError(error, res);
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