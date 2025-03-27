import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { ErrorEnum } from '../enums/errorEnum';
import AccountModel from '../models/AccountModel';

const SECRET_KEY = process.env.JWT_SECRET || 'defaultsecret';

export interface CustomRequest extends Request {
  user: AccountModel;

}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error(ErrorEnum.MISSING_TOKEN);
    }

    const decoded = jwt.verify(token, SECRET_KEY);

        // Vérification si le token décodé est du type JwtPayload et contient un `id`
        if (typeof decoded === 'string') {
            res.status(401).json({ message: ErrorEnum.INVALID_TOKEN });
            return;
        }
    
        const { id } = decoded;
        const user = await AccountModel.findByPk(id);
        if (!user) {
            res.status(401).json({ message: ErrorEnum.ACCOUNT_NOT_FOUND });
            return;
        }
    
        (req as CustomRequest).user = user;

    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).send(ErrorEnum.INVALID_SIGNATURE_OR_INCORRECT_TOKEN);
    } else {
      res.status(401).send(ErrorEnum.PLEASE_AUTHENTICATE);
    }
  }
};
