import { ErrorEnum } from "../enums/errorEnum";
import { BadRequestError } from "../Errors/BadRequestError";

export const validateEmail = (email: string) =>{
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        throw new BadRequestError(ErrorEnum.INVALID_EMAIL);
    }
}
