import { Request, Response } from "express";
import MissionModel from "../models/MissionModel";
import PictureModel from "../models/PictureModel";
import { ErrorEnum } from "../enums/errorEnum";
import { MissionEnum } from "./enums/MissionEnum";
import AccountMissionAssignModel from "../models/AccountMissionAssignModel";
import AccountModel from "../models/AccountModel";
import MissionTypeModel from "../models/MissionTypeModel";
import { uploadFiles } from "../services/UploadService";
import { IMAGES_MIME_TYPE } from "../services/enums/MimeTypeEnum";
import sequelize from "../config/sequelize";

export const createMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const { description, timeBegin, estimatedEnd, address, timeEnd, missionTypeId, accountAssignId } = req.body;
        let accepedUploadedFiles: string[] = [];
        let rejectedUploadFiles: string[] = [];

        // Vérification des champs obligatoires
        if (!description || !timeBegin || !address || !missionTypeId) {
            res.status(400).json({ message: ErrorEnum.MISSING_REQUIRED_FIELDS });
            return;
        }

        // Vérification du type de mission
        const missionType = await MissionTypeModel.findByPk(missionTypeId);
        if (!missionType) {
            res.status(400).json({ message: MissionEnum.MISSION_TYPE_DOESNT_EXIST });
            return;
        }

        // Création de la mission
        const newMission = await MissionModel.create({
            description,
            timeBegin,
            timeEnd,
            estimatedEnd,
            address,
            idMissionType: missionTypeId
        });

        // Vérification si l'account existe
        if (accountAssignId) {
            const accountExists = await AccountModel.findByPk(accountAssignId);
            if (accountExists) {
                await AccountMissionAssignModel.create({
                    idAccount: accountAssignId,
                    idMission: newMission.id
                });
            } else {
                res.status(404).json({ message: MissionEnum.USER_NOT_FOUND });
                return
            }
        }

        // Upload des fichiers et enregistrement des images associées
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            const { filesUploaded, rejectedFiles } = await uploadFiles(req.files as Express.Multer.File[], Object.values(IMAGES_MIME_TYPE));
            rejectedUploadFiles = rejectedFiles;
            accepedUploadedFiles = filesUploaded;
            const pictureRecords = filesUploaded.map(filePath => ({
                name: filePath.split("\\").pop(),
                alt: "Image de la mission",
                path: filePath,
                idMission: newMission.id
            }));
            await PictureModel.bulkCreate(pictureRecords);
        }

        // Réponse avec ou sans avertissement
        res.status(201).json({
            message: MissionEnum.MISSION_SUCCESSFULLY_CREATED,
            mission: { ...newMission.toJSON() }, 
            rejectedUploadFiles,
            accepedUploadedFiles,
        });
    } catch (error) {
        res.status(500).json({ message: MissionEnum.ERROR_DURING_CREATING_MISSION });
    }
};

export const assignMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { idAccounts } = req.body;

        if (!id || !idAccounts) {
            res.status(400).json({ error: ErrorEnum.MISSING_REQUIRED_FIELDS });
            return;
        }

        if(!Array.isArray(idAccounts)) {
            res.status(400).json({ error: ErrorEnum.INVALID_FILED_TYPE });
            return;
        }

        const mission = await MissionModel.findByPk(id);
        if (!mission) {
            res.status(404).json({ error: MissionEnum.MISSION_NOT_FOUND });
            return;
        }

        const transaction = await sequelize.transaction();

        await AccountMissionAssignModel.destroy({
            where: { idMission: id }
        });

        for (const idAccount of idAccounts) {
            const account = await AccountModel.findByPk(idAccount);
            if (!account) {
                transaction.rollback();
                res.status(404).json({ error: MissionEnum.USER_NOT_FOUND });
                return;
            }

            await AccountMissionAssignModel.create({
                idAccount: idAccount,
                idMission: id
            });
            
        }
        transaction.commit();

        res.status(200).json({ message: MissionEnum.MISSION_ASSIGNED });
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(400).json({ error: ErrorEnum.UNEXPECTED_ERROR });
        }
        return;
    }
};
