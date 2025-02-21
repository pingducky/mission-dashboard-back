import { Request, Response } from 'express';
import EmployeService from '../services/EmployeService';
import { ErrorEnum } from '../enums/errorEnum';

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
}