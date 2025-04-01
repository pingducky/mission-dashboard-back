import { Request, Response } from 'express';
import { ErrorEnum } from "../enums/errorEnum";
import { BadRequestError } from "../Errors/BadRequestError";
import { NotFoundError } from "../Errors/NotFoundError";
import AccountModel from "../models/AccountModel";
import TokenModel from "../models/TokenModel";
import { handleHttpError } from "../services/ErrorService";


export const getAccountByToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.params;
      console.debug("token : ", token)
  
      if (!token) {
        throw new BadRequestError(ErrorEnum.BAD_REQUEST);
      }
      const tokenData = await TokenModel.findOne({ where: { token, isValid: true } });
  
      if (!tokenData) {
        throw new BadRequestError(ErrorEnum.INVALID_TOKEN);
      }

      const tokenRecord = await TokenModel.findOne({ where: { token }});
      const idAccount = tokenRecord?.idAccount;
      
      const account = await AccountModel.findOne({where: {id: idAccount}})

      if (!account) {
        throw new NotFoundError(ErrorEnum.ACCOUNT_NOT_FOUND)
      }
      
      res.status(200).json({
        id: account.id,
        firstName: account.firstName,
        lastName: account.lastName,
        phoneNumber: account.phoneNumber,
        email: account.email,
        address: account.address,
        city: account.city,
        country: account.country,
        notificationMail: account.notificationMail,
        notificationSms: account.notificationSms,
        isEnable: account.isEnabled
      })
  
    } catch(error) {
      handleHttpError(error, res)
    }
  }
  