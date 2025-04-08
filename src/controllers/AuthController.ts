import {Request, Response} from 'express';
import AuthService from '../services/AuthService';
import {ErrorEnum} from '../enums/errorEnum';
import {validateEmail} from '../utils/Utils';
import {handleHttpError} from '../services/ErrorService';
import {BadRequestError} from '../Errors/BadRequestError';

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const {firstName, lastName, email, password, address, city, postalCode, phoneNumber} = req.body;

        if (!firstName || !lastName || !email || !password || !address || !city || !postalCode || !phoneNumber) {
            throw new BadRequestError(ErrorEnum.MISSING_REQUIRED_FIELDS);
        }

        validateEmail(email);

        const token = await AuthService.register(firstName, lastName, email, password, address, city, postalCode, phoneNumber);
        res.status(201).json({token});
    } catch (error) {
        handleHttpError(error, res);
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const {email, password} = req.body;

        if (!email || !password) {
            throw new BadRequestError(ErrorEnum.MISSING_REQUIRED_FIELDS);
        }

        validateEmail(email)

        const token = await AuthService.login(email, password);
        res.status(200).json({token});
    } catch (error) {
        handleHttpError(error, res);
    }
}
