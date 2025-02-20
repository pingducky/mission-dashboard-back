import { Request, Response } from "express";
import MissionModel from "../models/MissionModel";
import PictureModel from "../models/PictureModel";
import { uploadFiles } from "../services/UploadService";
import { ErrorEnum } from "../enums/errorEnum";
import { MissionEnum } from "./enums/MissionEnum";
import AccountMissionAssign from "../models/AccountMissionAssignModel";
import AccountModel from "../models/AccountModel"; 
import MissionTypeModel from "../models/MissionTypeModel";

export const createMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const { description, timeBegin, estimatedEnd, address, timeEnd, missionTypeId, accountAssignId } = req.body;
        let accountAssignationWarningMessage = undefined;

        // Vérification des champs obligatoires
        if (!description || !timeBegin || !address || !missionTypeId) {
            res.status(400).json({ message: ErrorEnum.MISSING_REQUIRED_FIELDS });
            return;
        }
        // Vérification du type de mission 
        const missionType = await MissionTypeModel.findByPk(missionTypeId);
        if (!missionType) {
            res.status(400).json({ message: MissionEnum.MISSION_TYPE_DOSNT_EXIST });
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
        
        // Vérification si l'accountAssignId existe
        if (accountAssignId) {
            const accountExists = await AccountModel.findByPk(accountAssignId);
            console.log("accountExists : ", accountExists);
            if (accountExists) {
                // Si l'account existe, on crée l'assignation
                console.log("creation accountMissionAssign")
                await AccountMissionAssign.create({
                    idAccount: accountAssignId,
                    idMission: newMission.id
                });
            } else {
                // Stocker un message d'avertissement au lieu de bloquer le processus
                accountAssignationWarningMessage = ErrorEnum.ACCOUNT_NOT_FOUND;
            }
        }

        // Upload des fichiers et enregistrement des images associées
        if (req.files && Array.isArray(req.files)) {
            const uploadedFiles = await uploadFiles(req.files as Express.Multer.File[]);
            for (const filePath of uploadedFiles) {
                await PictureModel.create({
                    name: filePath.split("\\").pop(),
                    alt: "Image de la mission",
                    path: filePath,
                    idMission: newMission.id
                });
            }
        }

        // Réponse avec ou sans avertissement
        res.status(201).json({ 
            message: MissionEnum.MISSION_SUCCESSFULLY_CREATED, 
            mission: newMission, 
            accountAssignationWarningMessage,
        });
    } catch (error) {
        res.status(500).json({ message: MissionEnum.ERROR_DURING_CREATING_MISSION });
    }
};
