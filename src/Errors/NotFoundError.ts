import { ErrorEnum } from "../enums/errorEnum";

export class NotFoundError extends Error {
    status: number;
    constructor(message: string) {
        super(message);
        this.name = ErrorEnum.NOT_FOUND;
        this.status = 404;
    }
}