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
        return;
    }
};

interface CustomRequest extends Request {
    token?: {
        id: number;
    };
}

/*
 * Gestion des filtres et du tri dynamique :
 *
 * Query params disponibles :
 * - from=YYYY-MM-DD        → filtre les missions dont la date de début (timeBegin) est après ou égale à cette date
 * - to=YYYY-MM-DD          → filtre les missions dont la date de début est avant ou égale à cette date
 * - filterByType=ID        → filtre les missions par ID de type de mission (idMissionType)
 *
 * Exemples d'appels :
 * GET /api/mission?from=2025-03-25
 *   → Missions à partir du 25 mars 2025
 *
 * GET /api/mission?from=2025-03-25&to=2025-03-30
 *   → Missions entre le 25 et le 30 mars
 *
 * GET /api/mission?filterByType=2&from=2025-03-25&to=2025-04-01
 *   → Missions du type 2, entre deux dates
 */
export const getMyMissions = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const accountId = req.token?.id;

        if (!accountId) {
             res.status(401).json({ message: MissionEnum.UNAUTHORIZED });
             return;
        }

        const {
            sortBy = "timeBegin",
            sortDirection = "ASC",
            filterByType,
            from,
            to
        } = req.query;

        const validSortFields = ["timeBegin", "timeEnd", "estimatedEnd", "missionType"];
        const direction = sortDirection.toString().toUpperCase() === "DESC" ? "DESC" : "ASC";

        // Construction du tri
        let order: any[] = [];

        if (sortBy === "missionType") {
            order.push([
                { model: MissionTypeModel, as: 'missionType' },
                'shortLibel',
                direction
            ]);
        } else if (validSortFields.includes(sortBy.toString())) {
            order.push([sortBy.toString(), direction]);
        }

        // Construction des conditions WHERE
        const missionWhere: any = {};

        if (filterByType) {
            missionWhere.idMissionType = Number(filterByType);
        }

        if (from || to) {
            missionWhere.timeBegin = {};
            if (from) {
                missionWhere.timeBegin[Op.gte] = new Date(from.toString());
            }
            if (to) {
                missionWhere.timeBegin[Op.lte] = new Date(to.toString());
            }
        }

        // Récupération des missions avec les relations
        const account = await AccountModel.findByPk(accountId, {
            include: [
                {
                    model: MissionModel,
                    as: 'missions',
                    required: false,
                    where: Object.keys(missionWhere).length > 0 ? missionWhere : undefined,
                    through: { attributes: [] },
                    include: [
                        {
                            model: MissionTypeModel,
                            as: 'missionType',
                            attributes: ['id', 'shortLibel', 'longLibel'],
                        },
                        {
                            model: PictureModel,
                            as: 'pictures',
                            attributes: ['id', 'name', 'path'],
                        },
                    ],
                    order: order.length > 0 ? order : undefined
                },
            ],
        });

        if (!account) {
            res.status(404).json({ message: MissionEnum.USER_NOT_FOUND });
            return;
        }

        res.status(200).json({
            missions: account.missions || [],
        });

    } catch (error) {
        res.status(500).json({ message: MissionEnum.ERROR_DURING_FETCHING_MISSION });
    }
};