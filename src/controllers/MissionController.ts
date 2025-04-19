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
import { handleHttpError } from "../services/ErrorService";
import { BadRequestError } from "../Errors/BadRequestError";
import { NotFoundError } from "../Errors/NotFoundError";
import fs from "fs";
import MessageModel from "../models/MessageModel";

export const createMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const { description, timeBegin, estimatedEnd, address, timeEnd, missionTypeId, accountAssignId } = req.body;
        let accepedUploadedFiles: string[] = [];
        let rejectedUploadFiles: string[] = [];

        // Vérification des champs obligatoires
        if (!description || !timeBegin || !address || !missionTypeId) {
            throw new BadRequestError(ErrorEnum.MISSING_REQUIRED_FIELDS)
        }

        // Vérification du type de mission
        const missionType = await MissionTypeModel.findByPk(missionTypeId);
        if (!missionType) {
            throw new BadRequestError(MissionEnum.MISSION_TYPE_DOESNT_EXIST)
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
                throw new NotFoundError(MissionEnum.USER_NOT_FOUND)
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
        handleHttpError(error, res);
    }
};

export const updateMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const { description, timeBegin, estimatedEnd, address, timeEnd, missionTypeId, picturesToDelete } = req.body;
        const missionId = req.params.id;

        if (!description || !timeBegin || !address || !missionTypeId || !missionId) {
            throw new BadRequestError(ErrorEnum.MISSING_REQUIRED_FIELDS);
        }

        let mission = await MissionModel.findByPk(missionId);
        if (!mission) {
            throw new NotFoundError(MissionEnum.MISSION_NOT_FOUND);
        }

        const missionType = await MissionTypeModel.findByPk(missionTypeId);
        if (!missionType) {
            throw new NotFoundError(MissionEnum.MISSION_TYPE_DOESNT_EXIST);
        }

        await MissionModel.update({
            description,
            timeBegin,
            timeEnd,
            estimatedEnd,
            address,
            idMissionType: missionTypeId
        }, {
            where: { id: missionId }
        });

        if (picturesToDelete) {
            if (!Array.isArray(picturesToDelete)) {
                throw new BadRequestError(ErrorEnum.BAD_REQUEST);
            }
        
            for (const id of picturesToDelete) {
                const picture = await PictureModel.findByPk(id);
                
                if (!picture) {
                    throw new NotFoundError(ErrorEnum.NOT_FOUND);
                }
        
                try {
                    // Use promise-based file deletion
                    await fs.promises.unlink(picture.path);
                    
                    // Only delete DB record after successful file deletion
                    await PictureModel.destroy({ where: { id } });
                } catch (error: any) {
                    // Handle specific file system errors
                    if (error.code === 'ENOENT') {
                        await PictureModel.destroy({ where: { id } });
                    } else {
                        throw new Error(ErrorEnum.UNEXPECTED_ERROR);
                    }
                }
            }
        }

        let accepedUploadedFiles: string[] = [];
        let rejectedUploadFiles: string[] = [];

        // Upload des fichiers et enregistrement des images associées
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            const { filesUploaded, rejectedFiles } = await uploadFiles(req.files as Express.Multer.File[], Object.values(IMAGES_MIME_TYPE));
            rejectedUploadFiles = rejectedFiles;
            accepedUploadedFiles = filesUploaded;
            const pictureRecords = filesUploaded.map(filePath => ({
                name: filePath.split("\\").pop(),
                alt: "Image de la mission",
                path: filePath,
                idMission: missionId
            }));
            await PictureModel.bulkCreate(pictureRecords);
        }

        // Réponse avec ou sans avertissement
        res.status(200).json({
            message: MissionEnum.MISSION_SUCCESSFULLY_UPDATED,
            mission: { ...mission.toJSON() }, 
            rejectedUploadFiles,
            accepedUploadedFiles,
        });
    } catch (error: unknown) {
        handleHttpError(error, res);
    }
}
export const getDetailMissionById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const missionId = Number(id);

        if (isNaN(missionId)) {
            res.status(400).json({ message: ErrorEnum.INVALID_ID });
            return;
        }

        const mission = await MissionModel.findByPk(missionId, {
            include: [
                {
                    // Type de mission
                    model: MissionTypeModel,
                    as: 'type',
                    attributes: ['shortLibel', 'longLibel']
                },
                {
                    // Compte associé à la mission
                    model: AccountModel,
                    attributes: ['id', 'firstName', 'lastName', 'email'],
                    through: { attributes: [] }
                },
                {
                    model: PictureModel,
                    as: 'pictures',
                },
                {
                    model: MessageModel,
                    as: 'messages',
                    attributes: ['id', 'message', 'createdAt'],
                    include: [{
                        model: AccountModel,
                        attributes: ['id', 'firstName', 'lastName']
                    }]
                }
            ],
        });

        if (!mission) {
            res.status(404).json({ message: MissionEnum.MISSION_NOT_FOUND });
            return;
        }

        res.status(200).json({
            mission: mission.toJSON()
        });

    } catch (error) {
        res.status(500).json({ message: MissionEnum.ERROR_DURING_FETCHING_MISSION });
    }
};

export const getMessagesByMissionId = async (req: Request, res: Response): Promise<void> => {
    try {
        const idMission = parseInt(req.params.idMission, 10);

        //Vérification de l'ID
        if (isNaN(idMission)) {
            throw new BadRequestError(ErrorEnum.INVALID_ID);
        }

        //Vérifie que la mission existe
        const mission = await MissionModel.findByPk(idMission);
        if (!mission) {
            throw new NotFoundError(MissionEnum.MISSION_NOT_FOUND);
        }

        //Récupère tous les messages associés à cette mission
        const messages = await MessageModel.findAll({
            where: { idMission },
            include: [
                {
                    model: AccountModel,
                    as: "author",
                    attributes: ["id", "firstName", "lastName", "email"]
                }
            ],
            order: [["createdAt", "DESC"]]
        });

        res.status(200).json({ messages });
    } catch (error) {
        console.error("Erreur dans getDetailMissionById:", error); // ← Ajoute ça
        handleHttpError(error, res);
    }
};