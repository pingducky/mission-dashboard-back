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