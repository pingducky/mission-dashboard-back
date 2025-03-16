import { ErrorEnum } from "../enums/errorEnum";

export class UnauthorizedError extends Error {
    status: number;
    constructor(message: string) {
        super(message);
        this.name = ErrorEnum.UNAUTHORIZED;
        this.status = 401;
    }
}