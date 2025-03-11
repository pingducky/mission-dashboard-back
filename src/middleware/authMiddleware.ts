import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { ErrorEnum } from '../enums/errorEnum';

const SECRET_KEY = process.env.JWT_SECRET || 'defaultsecret';

interface CustomRequest extends Request {
  token?: any;
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error(ErrorEnum.MISSING_TOKEN);
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    (req as CustomRequest).token = decoded;

    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).send(ErrorEnum.INVALID_SIGNATURE_OR_INCORRECT_TOKEN);
    } else {
      res.status(401).send(ErrorEnum.PLEASE_AUTHENTICATE);
    }
  }
};
