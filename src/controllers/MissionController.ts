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

export const getMissionDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const { missionId } = req.params;

        // Vérification de l'existence de la mission
        const mission = await MissionModel.findByPk(missionId);

        if (!mission) {
            res.status(404).json({ message: "Mission non trouvée." });
            return;
        }

        // Récupérer les images associées à la mission
        const pictures = await PictureModel.findAll({
            where: { idMission: mission.id }
        });

        // Retourner les détails de la mission avec ses images
        res.status(200).json({
            mission: {
                id: mission.id,
                description: mission.description,
                timeBegin: mission.timeBegin,
                timeEnd: mission.timeEnd,
                estimatedEnd: mission.estimatedEnd,
                address: mission.address,
                missionTypeId: mission.idMissionType
            },
            pictures: pictures.map(picture => ({
                id: picture.id,
                name: picture.name,
                alt: picture.alt,
                path: picture.path
            }))
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des détails de la mission :", error);
        res.status(500).json({ message: "Une erreur est survenue lors de la récupération des détails de la mission." });
    }
};