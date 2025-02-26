import { ErrorEnum } from "../enums/errorEnum";

export class InternalServerError extends Error {
    status: number;
    constructor(message: string = ErrorEnum.UNEXPECTED_ERROR) {
        super(message);
        this.name = ErrorEnum.INTERNAL_SERVER_ERROR;
        this.status = 500;
    }
}