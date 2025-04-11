import { Request, Response } from "express";
import { handleHttpError } from "../services/ErrorService";
import FileModel from "../models/FileModel";
import AccountModel from "../models/AccountModel";
import { NotFoundError } from "../Errors/NotFoundError";
import { ErrorEnum } from "../enums/errorEnum";

export const getFileByAccountId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const user   = await AccountModel.findByPk(id);

        if (!user) {
            throw new NotFoundError(ErrorEnum.ACCOUNT_NOT_FOUND);
        }

        FileModel.findAll({
            where: {
                idAccount: id,
            },
        }) .then((files: FileModel[]) => {
            if (files.length === 0) {
                res.status(204).json();
                return;
            }

            res.status(200).json(files);
            return;
        })

    } catch (error: unknown) {
        handleHttpError(error, res);
    }
}