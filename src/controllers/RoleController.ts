import { Request, Response } from 'express';
import RoleModel from '../models/RoleModel';
import { ErrorEnum } from '../enums/errorEnum';

export const getRoles = async (req: Request, res: Response): Promise<void> => {
    try {
        const roles = await RoleModel.findAll();
        res.status(200).json(roles);
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(400).json({ error: ErrorEnum.UNEXPECTED_ERROR });
        }
    }
};

export const createRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const { shortLibel, longLibel } = req.body;

        if (!shortLibel || !longLibel) {
            throw new Error(ErrorEnum.MISSING_REQUIRED_FIELDS);
        }

        if (shortLibel.length > 10 || longLibel.length > 50) {
            throw new Error(ErrorEnum.INVALID_FIELDS_LENGTH);
        }

        const role = await RoleModel.create({ shortLibel, longLibel });

        res.status(201).json(role);
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(400).json({ error: ErrorEnum.UNEXPECTED_ERROR });
        }
    }
}