import { Request, Response } from 'express';
import EmployeService from '../services/EmployeService';
import { ErrorEnum } from '../enums/errorEnum';

export const disableEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id, 10);
        const employee = await EmployeService.disableEmployee(id);
        if (employee) {
            res.status(200).json(employee);
        } else {
            res.status(400).json({ message: ErrorEnum.ACCOUNT_NOT_FOUND });
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(400).json({ error: ErrorEnum.UNEXPECTED_ERROR });
        }
    }
}
