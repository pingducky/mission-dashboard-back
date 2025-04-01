import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import AccountModel from '../models/AccountModel';
import { ErrorEnum } from '../enums/errorEnum';
import { BadRequestError } from '../Errors/BadRequestError';

const SECRET_KEY = process.env.JWT_SECRET || 'defaultsecret';
const JWT_EXPIRES_IN = '1h';

export type RegisterParams = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
};


class AuthService {
  public static async register(params: RegisterParams): Promise<string> {
    const { firstName, lastName, email, password, phoneNumber, address, city, country, postalCode } = params;
  
    const existingUser = await AccountModel.findOne({ where: { email } });
    
    if (existingUser) {
      throw new BadRequestError(ErrorEnum.EMAIL_ALREADY_USED);
    }
  
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newAccount = await AccountModel.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      isEnabled: true,
      phoneNumber,
      address,
      city,
      country,
      postalCode,
    });
    
    return AuthService.generateJwt(newAccount);
  }

  public static async login(email: string, password: string): Promise<string> {
    const account = await AccountModel.findOne({ where: { email } });
    if (!account) {
      throw new BadRequestError(ErrorEnum.ACCOUNT_NOT_FOUND);
    }

    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
        throw new BadRequestError(ErrorEnum.PASSWORD_INVALID);
    }

    return AuthService.generateJwt(account);
  }

  private static generateJwt(account: AccountModel): string {
    return jwt.sign({ id: account.id, email: account.email }, SECRET_KEY, {
      expiresIn: JWT_EXPIRES_IN
    });
  }

  public static verifyJwt(token: string): JwtPayload | string {
    try {
      return jwt.verify(token, SECRET_KEY);
    } catch (error) {
      throw new BadRequestError(ErrorEnum.INVALID_TOKEN);
    }
  }
}

export default AuthService;