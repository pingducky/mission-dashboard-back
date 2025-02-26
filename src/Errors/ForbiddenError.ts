import { ErrorEnum } from "../enums/errorEnum";

export class ForbiddenError extends Error {
    status: number;
    constructor(message: string) {
        super(message);
        this.name = ErrorEnum.FORBIDDEN;
        this.status = 403;
    }
}