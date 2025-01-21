import { Request, Response } from 'express';
import AuthService from '../services/AuthService';
import { ErrorEnum } from '../enums/errorEnum';
import { validateEmail } from '../utils/Utils';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password, phoneNumber } = req.body;

    if (!firstName || !lastName || !email || !password || !phoneNumber) {
      throw new Error(ErrorEnum.MISSING_REQUIRED_FIELDS);
    }

    validateEmail(email);

    const token = await AuthService.register(firstName, lastName, email, password, phoneNumber);
    res.status(201).json({ token });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(400).json({ error: ErrorEnum.UNEXPECTED_ERROR });
    }
  };
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if ( !email || !password) {
      throw new Error(ErrorEnum.MISSING_REQUIRED_FIELDS);
    }

    const token = await AuthService.login(email, password);
    res.status(200).json({ token });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(400).json({ error: ErrorEnum.UNEXPECTED_ERROR });
    }
  };
}
