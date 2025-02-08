import { ErrorEnum } from "../enums/errorEnum";

export const validateEmail = (email: string) =>{
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        throw new Error(ErrorEnum.INVALID_EMAIL);
    }
}
