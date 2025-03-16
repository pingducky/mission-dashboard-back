import { ErrorEnum } from "../enums/errorEnum";

export class BadRequestError extends Error {
    status: number;
    constructor(message: string) {
        super(message);
        this.name = ErrorEnum.BAD_REQUEST;
        this.status = 400;
    }
}