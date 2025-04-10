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
import {Op} from "sequelize";

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

// export const getMissionsByAccountId = async (req: Request, res: Response): Promise<void> => {
//     try {
//         const accountId = parseInt(req.params.id, 10);
//
//         if (isNaN(accountId)) {
//             res.status(400).json({ error: 'ID invalide' });
//             return;
//         }
//
//         // Vérifie si l'utilisateur existe
//         const account = await AccountModel.findByPk(accountId);
//         if (!account) {
//             throw new NotFoundError("Compte non trouvé");
//         }
//
//         // Recherche de toutes les missions liées à l'utilisateur avec les images et le type de mission
//         const missions = await MissionModel.findAll({
//             include: [
//                 {
//                     model: AccountModel,
//                     where: { id: accountId },
//                     attributes: [], // On ne retourne pas les infos du user ici
//                     through: { attributes: [] }, // Pas besoin des infos de la table pivot
//                 },
//                 {
//                     model: PictureModel,
//                     as: 'pictures',
//                     attributes: ['id', 'name', 'alt', 'path']
//                 },
//                 {
//                     model: MissionTypeModel,
//                     as: 'missionType',
//                     attributes: ['id', 'shortLibel', 'longLibel']
//                 }
//             ]
//         });
//
//         res.status(200).json({ missions });
//     } catch (error) {
//         console.error(error); // ← pour voir l'erreur en console
//         res.status(500).json({ error: 'Erreur serveur' });
//     }
// };


/*
 * Gestion des filtres et du tri dynamique :
 *
 * Query params disponibles :
 * - from=YYYY-MM-DD        → filtre les missions dont la date de début (timeBegin) est après ou égale à cette date
 * - to=YYYY-MM-DD          → filtre les missions dont la date de début est avant ou égale à cette date
 * - filterByType=ID        → filtre les missions par ID de type de mission (idMissionType)
 *
 * Exemples d'appels :
 * GET /api/mission/1?from=2025-03-25
 *   → Missions à partir du 25 mars 2025
 *
 * GET /api/mission/1?from=2025-03-25&to=2025-03-30
 *   → Missions entre le 25 et le 30 mars
 *
 * GET /api/mission/1?filterByType=2
 *    → Récupération des missions du type 2
 *
 * GET /api/mission/1?filterByType=2&from=2025-03-25&to=2025-04-01
 *   → Missions du type 2, entre deux dates
 */
export const getListMissionsByAccountId = async (req: Request, res: Response): Promise<void> => {
    try {
        const accountId = parseInt(req.params.id, 10);
        const { from, to, filterByType } = req.query;

        if (isNaN(accountId)) {
            res.status(400).json({ error: 'ID invalide' });
            return;
        }

        const account = await AccountModel.findByPk(accountId);
        if (!account) {
            res.status(404).json({ error: 'Compte non trouvé' });
            return;
        }

        //Construction dynamique du WHERE
        const where: any = {};

        if (from) {
            where.timeBegin = { [Op.gte]: new Date(from as string) };
        }

        if (to) {
            where.timeBegin = {
                ...(where.timeBegin || {}),
                [Op.lte]: new Date(to as string)
            };
        }

        if (filterByType) {
            where.idMissionType = parseInt(filterByType as string, 10);
        }

        const missions = await MissionModel.findAll({
            where,
            include: [
                {
                    model: AccountModel,
                    where: { id: accountId },
                    attributes: [],
                    through: { attributes: [] }
                },
                {
                    model: PictureModel,
                    as: 'pictures',
                    attributes: ['id', 'name', 'alt', 'path']
                },
                {
                    model: MissionTypeModel,
                    as: 'missionType',
                    attributes: ['id', 'shortLibel', 'longLibel']
                }
            ]
        });

        res.status(200).json({ missions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};