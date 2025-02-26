import { Request, Response } from 'express';
import AccountModel from '../models/AccountModel';
import { ErrorEnum } from '../enums/errorEnum';
import { CustomRequest } from '../middleware/authMiddleware';

export const disableEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
        const { user } = req as CustomRequest; // Todo : récupère les droits à partir du compte utilisateur qui à fait la requête
        // Pas besoin de vérifier si le compte existe en base, c'est déja fait dans le middleware

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