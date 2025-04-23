import { Request, Response } from 'express';
import RoleModel from '../models/RoleModel';
import { ErrorEnum } from '../enums/errorEnum';
import EmployeService from '../services/enums/EmployeService';
import { handleHttpError } from '../services/ErrorService';
import { BadRequestError } from '../Errors/BadRequestError';

export const getRoles = async (req: Request, res: Response): Promise<void> => {
    try {
        const roles = await RoleModel.findAll();
        res.status(200).json(roles);
    } catch (error: unknown) {
        handleHttpError(error, res);
    }
};

export const createRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const { shortLibel, longLibel } = req.body;

        if (!shortLibel || !longLibel) {
            throw new BadRequestError(ErrorEnum.MISSING_REQUIRED_FIELDS);
        }

        if (shortLibel.length > 10 || longLibel.length > 50) {
            throw new BadRequestError(ErrorEnum.INVALID_FIELDS_LENGTH);
        }

        const role = await RoleModel.create({ shortLibel, longLibel });

        res.status(201).json(role);
    } catch (error: unknown) {
        handleHttpError(error, res);
    }
}

export const updateEmployeRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const { roleId, add } = req.body;
        const employeId = parseInt(req.params.id, 10);

        if ( !employeId || !roleId || typeof add != 'boolean') {
          throw new BadRequestError(ErrorEnum.MISSING_REQUIRED_FIELDS);
        }

        const executed = await EmployeService.updateEmployeRole(employeId, roleId, add);

        res.status(200).json({ executed });
    } catch (error: unknown) {
        handleHttpError(error, res);
    }
};
