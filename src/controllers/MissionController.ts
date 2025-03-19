import { Request, Response } from "express";
import MissionModel from "../models/MissionModel";
import PictureModel from "../models/PictureModel";
import { ErrorEnum } from "../enums/errorEnum";
import { MissionEnum } from "./enums/MissionEnum";
import AccountMissionAssignModel from "../models/AccountMissionAssignModel";
import AccountModel from "../models/AccountModel";
import MissionTypeModel from "../models/MissionTypeModel";
import {deleteFile, uploadFiles} from "../services/UploadService";
import { IMAGES_MIME_TYPE } from "../services/enums/MimeTypeEnum";
import fs from "fs";

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

export const getMissionById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        //Conversion en nombre
        const missionId = Number(id);
        if (isNaN(missionId)) {
            res.status(400).json({ message: ErrorEnum.ID_INVALID });
            return;
        }

        //Recherche de la mission avec jointure des photos
        const mission = await MissionModel.findByPk(missionId, {
            include: [
                {
                    model: PictureModel,
                    as: 'pictures',
                    attributes: ['id', 'name', 'alt', 'path']
                }
            ]
        });

        if (!mission) {
            res.status(404).json({ message: MissionEnum.MISSION_NOT_FOUND });
            return;
        }

        res.status(200).json({
            mission: {
                ...mission.toJSON(),
                pictures: mission.pictures || []
            }
        });

    } catch (error) {
        res.status(500).json({ message: MissionEnum.ERROR_DURING_FETCHING_MISSION });
    }
};

export const deleteMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const { missionId } = req.params;

        if (!missionId || isNaN(Number(missionId))) {
            res.status(400).json({ message: MissionEnum.INVALID_MISSION_ID });
            return;
        }

        const mission = await MissionModel.findByPk(missionId);

        if (!mission) {
            res.status(404).json({ message: MissionEnum.MISSION_NOT_FOUND });
            return;
        }

        await AccountMissionAssignModel.destroy({
            where: { idMission: missionId }
        });

        const pictures = await PictureModel.findAll({ where: { idMission: missionId } });
        for (const picture of pictures) {
            if (fs.existsSync(picture.path)) {
                fs.unlinkSync(picture.path);
            }
        }

        await PictureModel.destroy({ where: { idMission: missionId } });

        await mission.destroy({ force: true });

        res.status(200).json({ message: MissionEnum.MISSION_SUCCESSFULLY_DELETED });
    } catch (error) {
        console.error("Erreur lors de la suppression de la mission :", error);
        res.status(500).json({ message: MissionEnum.ERROR_DURING_DELETING_MISSION });
    }
};