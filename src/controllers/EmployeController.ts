import { Request, Response } from 'express';
import AccountModel from '../models/AccountModel';
import { ErrorEnum } from '../enums/errorEnum';

export const disableEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id, 10);
        const employee = await AccountModel.findByPk(id);
        
        if (!employee) {
            res.status(400).json({ message: ErrorEnum.ACCOUNT_NOT_FOUND });
            return;
        }
        
        await employee.update({ isEnabled: false });
        res.status(204).send();
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(400).json({ error: ErrorEnum.UNEXPECTED_ERROR });
        }
    }
};