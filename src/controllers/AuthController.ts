import { Request, Response } from 'express';
import AuthService from '../services/AuthService';
import { ErrorEnum } from '../enums/errorEnum';
import { validateEmail } from '../utils/Utils';
import { handleHttpError } from '../services/ErrorService';
import { BadRequestError } from '../Errors/BadRequestError';
import TokenModel from '../models/TokenModel';
import AccountModel from '../models/AccountModel';
import { AuthEnum } from './enums/AuthEnum';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password, address, city, postalCode, hiringDate, phoneNumber } = req.body;

    if (!firstName || !lastName || !email || !password || !address || !city || !postalCode || !hiringDate || !phoneNumber) {
      throw new BadRequestError(ErrorEnum.MISSING_REQUIRED_FIELDS);
    }

    validateEmail(email);

    const token = await AuthService.register(firstName, lastName, email, password, phoneNumber, address, city, postalCode,
        hiringDate);
    const { id } = await AccountModel.findOne({ where: { email }, attributes: ['id'] }) || {};

    if(!id) {
      throw new BadRequestError(ErrorEnum.INVALID_EMAIL);
    }

    TokenModel.create({
      token,
      isValid: true,
      idAccount: id,
    });

    res.status(201).json({ token });
  } catch (error) {
    handleHttpError(error, res);
}
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if ( !email || !password) {
      throw new BadRequestError(ErrorEnum.MISSING_REQUIRED_FIELDS);
    }

    validateEmail(email)

    const token = await AuthService.login(email, password);
    const { id } = await AccountModel.findOne({ where: { email }, attributes: ['id'] }) || {};

    if(!id) {
      throw new BadRequestError(ErrorEnum.INVALID_EMAIL);
    }

    TokenModel.create({
      token,
      isValid: true,
      idAccount: id,
    });

    res.status(200).json({ token });
  } catch (error) {
    handleHttpError(error, res);
  }
}

export const disconnect = async (req: Request, res:Response): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new Error(ErrorEnum.MISSING_TOKEN);
    }

    await TokenModel.update({ isValid: false }, { where: { token } });
    res.status(200).json({ message: AuthEnum.SUCCESSFULLY_DISCONNECTED })
  } catch (error: unknown) {
    handleHttpError(error, res);
  }
}
