import { Request, Response } from 'express';
import { ErrorEnum } from '../enums/errorEnum';
import PermissionModel from '../models/PermissionModel';
import { PermissionMessageEnum } from './enums/PermissionMessageEnum';

export const createPermission = async (req: Request, res: Response): Promise<void> => {
    try {
        const { shortLibel, longLibel } = req.body;

        if (!shortLibel || !longLibel) {
            res.status(400).json({ error: ErrorEnum.MISSING_REQUIRED_FIELDS });
            return;
        }

        if(shortLibel.length > 10 || longLibel.length > 50) {
            res.status(400).json({ error: ErrorEnum.INVALID_FIELDS_LENGTH });
            return;
        }

        PermissionModel.create({ shortLibel, longLibel });
        res.status(201).json({ message: PermissionMessageEnum.PERMISSION_CREATED });
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(400).json({ error: ErrorEnum.UNEXPECTED_ERROR });
        }
        return;
    }
};