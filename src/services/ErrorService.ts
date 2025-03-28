import { ErrorEnum } from "../enums/errorEnum";
import { NotFoundError } from "../Errors/NotFoundError";
import { Response } from "express";
import { UnauthorizedError } from "../Errors/UnauthorizedError";
import { ForbiddenError } from "../Errors/ForbiddenError";
import { BadRequestError } from "../Errors/BadRequestError";

export const handleHttpError = (error: unknown, res: Response): void => {
    console.log("error ", error);
    if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
        return;
    }
    if (error instanceof UnauthorizedError) {
        res.status(401).json({ error: error.message });
        return;
    }
    if (error instanceof ForbiddenError) {
        res.status(403).json({ error: error.message });
        return;
    }
    if (error instanceof BadRequestError) {
        res.status(400).json({ error: error.message });
        return;
    }

    res.status(500).json({ error: ErrorEnum.UNEXPECTED_ERROR });
};
