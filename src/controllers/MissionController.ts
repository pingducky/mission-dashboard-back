import { Request, Response } from "express";
import MissionModel from "../models/MissionModel";
import PictureModel from "../models/PictureModel";
import { uploadFiles } from "../services/UploadService";

export const createMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const { description, timeBegin, estimatedEnd, address, timeEnd, missionTypeId, pictureId } = req.body;

        // Vérification des champs obligatoires
        if (!description || !timeBegin || !address || !missionTypeId) {
            res.status(400).json({ message: "Les champs description, timeBegin, address et idMissionType sont obligatoires." });
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

        // Upload des fichiers et enregistrement des images associées
        if (req.files && Array.isArray(req.files)) {
            const uploadedFiles = await uploadFiles(req.files as Express.Multer.File[]);
            for (const filePath of uploadedFiles) {
                await PictureModel.create({
                    name: filePath,
                    alt: "Mission Image",
                    path: filePath,
                    idMission:newMission.id
                });
            }
        }

        res.status(201).json({ message: "Mission créée avec succès", mission: newMission });
    } catch (error) {
        console.error("Erreur lors de la création de la mission :", error);
        res.status(500).json({ message: "Une erreur est survenue lors de la création de la mission." });
    }
};
