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
import {Op} from "sequelize";
import path from "path";

export const createMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            description,
            timeBegin,
            estimatedEnd,
            address,
            city,
            postalCode,
            countryCode,
            timeEnd,
            missionTypeId,
            accountAssignIds
        } = req.body;

        let acceptedUploadedFiles: string[] = [];
        let rejectedUploadFiles: Array<{ id: string, reason: string }> = [];

        const assignedAccounts: any[] = [];
        const failedAssignments: { accountId: number, reason: string }[] = [];

        if (!description || !timeBegin || !estimatedEnd || !address || !city || !postalCode || !countryCode || !missionTypeId || !accountAssignIds) {
            throw new BadRequestError(ErrorEnum.MISSING_REQUIRED_FIELDS);
        }

        let parsedAccountAssignIds: number[] = [];
        if (typeof accountAssignIds === 'string') {
            try {
                parsedAccountAssignIds = JSON.parse(accountAssignIds);
            } catch {
                throw new BadRequestError(MissionEnum.ACCOUNT_ASSIGN_ID_JSON);
            }
        } else if (Array.isArray(accountAssignIds)) {
            parsedAccountAssignIds = accountAssignIds;
        }

        // Vérification du type de mission
        const missionType = await MissionTypeModel.findByPk(missionTypeId);
        if (!missionType) {
            throw new BadRequestError(MissionEnum.MISSION_TYPE_DOESNT_EXIST);
        }

        // Vérification des comptes à assigner
        for (const accountId of parsedAccountAssignIds) {
            const account = await AccountModel.findByPk(accountId);
            if (!account) {
                failedAssignments.push({ accountId, reason: MissionEnum.NOT_FOUND_ACCOUNT });
                continue;
            }

            const conflictingMission = await AccountMissionAssignModel.findOne({
                where: { idAccount: accountId },
                include: [{
                    model: MissionModel,
                    as: 'mission',
                    where: {
                        [Op.or]: [
                            { timeBegin: { [Op.between]: [timeBegin, estimatedEnd] } },
                            { estimatedEnd: { [Op.between]: [timeBegin, estimatedEnd] } },
                            {
                                [Op.and]: [
                                    { timeBegin: { [Op.lte]: timeBegin } },
                                    { estimatedEnd: { [Op.gte]: estimatedEnd } }
                                ]
                            }
                        ]
                    }
                }]
            });

            if (conflictingMission) {
                failedAssignments.push({ accountId, reason: MissionEnum.CONFLIT_MISSION });
                continue;
            }

            assignedAccounts.push(account);
        }

        // Si aucun compte assignable, on annule la création
        if (assignedAccounts.length === 0) {
            throw new BadRequestError(MissionEnum.BAD_ACCOUNT_ASSIGNATION)
        }

        // Création de la mission
        const newMission = await MissionModel.create({
            description,
            timeBegin,
            timeEnd: null,
            estimatedEnd: estimatedEnd,
            address,
            city,
            postalCode,
            countryCode,
            idMissionType: missionTypeId
        });

        // Assignation des comptes valides
        for (const account of assignedAccounts) {
            await AccountMissionAssignModel.create({
                idAccount: account.id,
                idMission: newMission.id
            });
        }

        // Upload des fichiers
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            const { filesUploaded, rejectedFiles } = await uploadFiles(
                req.files as Express.Multer.File[],
                Object.values(IMAGES_MIME_TYPE)
            );
            rejectedUploadFiles = rejectedFiles;
            acceptedUploadedFiles = filesUploaded;

            const pictureRecords = filesUploaded.map(filePath => ({
                name: path.basename(filePath),
                alt: "Image de la mission",
                path: filePath,
                idMission: newMission.id
            }));
            await PictureModel.bulkCreate(pictureRecords);
        }

        res.status(201).json({
            missionId: newMission.id,
            assignedAccountIds: assignedAccounts.map(account => account.id),
            failedAssignments: failedAssignments.map(entry => ({
                accountId: entry.accountId,
                reason: entry.reason
            })),
            uploadedFiles: acceptedUploadedFiles,
            rejectedFiles: rejectedUploadFiles
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
        let rejectedUploadFiles: Array<{id: string, reason: string}> = [];

        // Upload des fichiers et enregistrement des images associées
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            const { filesUploaded, rejectedFiles } = await uploadFiles(req.files as Express.Multer.File[], Object.values(IMAGES_MIME_TYPE));
            rejectedUploadFiles = rejectedFiles;
            accepedUploadedFiles = filesUploaded;
            const pictureRecords = filesUploaded.map(filePath => ({
                name: path.basename(filePath),
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

export const deleteMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            res.status(400).json({ message: MissionEnum.INVALID_MISSION_ID });
            return;
        }

        const mission = await MissionModel.findByPk(id);

        if (!mission) {
            res.status(404).json({ message: MissionEnum.MISSION_NOT_FOUND });
            return;
        }

        // Supprime les messages liés à la mission
        await MessageModel.destroy({ where: { idMission: id } });

        // Supprime les assignations liées
        await AccountMissionAssignModel.destroy({ where: { idMission: id } });

        // Supprime les images sur le disque
        const pictures = await PictureModel.findAll({ where: { idMission: id } });
        for (const picture of pictures) {
            if (fs.existsSync(picture.path)) {
                fs.unlinkSync(picture.path);
            }
        }

        // Supprime les enregistrements d'images en BDD
        await PictureModel.destroy({ where: { idMission: id } });

        await mission.destroy({ force: true });

        res.status(200).json({ message: MissionEnum.MISSION_SUCCESSFULLY_DELETED });
    } catch (error) {
        handleHttpError(error, res);
    }
};

export const addMessageToMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const { message, idAccount } = req.body;
        const idMission = parseInt(req.params.idMission, 10);

        if (!message || !idAccount || isNaN(idMission)) {
            throw new BadRequestError(ErrorEnum.MISSING_REQUIRED_FIELDS);
        }

        const mission = await MissionModel.findByPk(idMission);
        if (!mission) {
            throw new NotFoundError(MissionEnum.MISSION_NOT_FOUND);
        }

        const account = await AccountModel.findByPk(idAccount);
        if (!account) {
            throw new NotFoundError(MissionEnum.USER_NOT_FOUND);
        }

        const newMessage = await MessageModel.create({
            message,
            idAccount,
            idMission,
        });

        res.status(201).json({
            message: MissionEnum.MISSION_ADD_COMMENT_SUCCESS,
            id: newMessage.id,
        });
    } catch (error) {
        handleHttpError(error, res);
    }
};

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
                    as: 'missionType',
                    attributes: ['shortLibel', 'longLibel']
                },
                {
                    // Participants de la mission
                    model: AccountModel,
                    attributes: ['id', 'firstName', 'lastName', 'email'],
                    through: { attributes: [] }
                },
                {
                    // Images liées à la mission
                    model: PictureModel,
                    as: 'pictures',
                    attributes: ['id', 'name', 'alt', 'path']
                },
                {
                    // Messages + auteur de chaque message
                    model: MessageModel,
                    as: 'messages',
                    attributes: ['id', 'message', 'createdAt'],
                    include: [
                        {
                            model: AccountModel,
                            as: 'author',
                            attributes: ['id', 'firstName', 'lastName']
                        }
                    ]
                }
            ]
        });

        if (!mission) {
            res.status(404).json({ message: MissionEnum.MISSION_NOT_FOUND });
            return;
        }

        res.status(200).json(mission.toJSON());

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
        handleHttpError(error, res);
    }
};

/*
 * Récupération des missions d’un employé avec filtres dynamiques
 *
 * Route :
 *   GET http://localhost:3000/api/mission/listMissions/:idEmployee
 *
 * Query params disponibles :
 * - from=YYYY-MM-DD        → Filtre les missions dont la date de début (timeBegin) est >= à cette date
 * - to=YYYY-MM-DD          → Filtre les missions dont la date de début (timeBegin) est <= à cette date
 * - filterByType=ID        → Filtre les missions par identifiant de type de mission (idMissionType)
 * - limit=N                → Limite le nombre de missions retournées à N
 * - status=[actives|past|upcoming|canceled|all]
 *                          → Filtre les missions selon leur statut :
 *                              - actives : timeBegin ≤ now && (timeEnd ≥ now || timeEnd is null)
 *                              - past : timeEnd < now
 *                              - upcoming : timeBegin > now
 *                              - canceled : mission.isCanceled = true
 *                              - all : aucun filtre appliqué (valeur par défaut)
 *
 * Exemples d’appels :
 * GET /api/mission/listMissions/1?from=2025-03-25
 *   → Missions à partir du 25 mars 2025
 *
 * GET /api/mission/listMissions/1?from=2025-03-25&to=2025-03-30
 *   → Missions entre le 25 et le 30 mars 2025
 *
 * GET /api/mission/listMissions/1?filterByType=2
 *   → Missions de type 2
 *
 * GET /api/mission/listMissions/1?filterByType=2&from=2025-03-25&to=2025-04-01
 *   → Missions de type 2 entre deux dates
 *
 * GET /api/mission/listMissions/1?limit=5
 *   → 5 dernières missions (ordonnées par date décroissante)
 *
 * GET /api/mission/listMissions/1?status=actives
 *   → Missions actuellement actives
 *
 * GET /api/mission/listMissions/1?status=upcoming&limit=3
 *   → Prochaines missions à venir, limitées à 3
 *
 * GET /api/mission/listMissions/1?status=passees&from=2025-01-01
 *   → Missions passées à partir du 1er janvier 2025
 */
export const getListMissionsByAccountId = async (req: Request, res: Response): Promise<void> => {
    try {
        const accountId = parseInt(req.params.id, 10);
        const { from, to, filterByType, limit, status = 'all' } = req.query;

        if (isNaN(accountId)) {
            throw new BadRequestError(ErrorEnum.INVALID_ID);
        }

        const account = await AccountModel.findByPk(accountId);
        if (!account) {
            throw new NotFoundError(MissionEnum.USER_NOT_FOUND);
        }

        const now = new Date();
        const where: any = {};
        const whereAccount: any = {};

        if(!account.isAdmin) {
            whereAccount.id = account.id;
        }

        // Filtres temporels
        if (from || to) {
            where.timeBegin = {};
            if (from) {
                where.timeBegin[Op.gte] = new Date(from as string);
            }
            if (to) {
                where.timeBegin[Op.lte] = new Date(to as string);
            }
        }

        // Filtre par type de mission
        if (filterByType) {
            where.idMissionType = parseInt(filterByType as string, 10);
        }

        // Filtres par statut
        switch (status) {
            case 'actives':
                where.timeBegin = {
                    ...(where.timeBegin || {}),
                    [Op.lte]: now,
                };
                where.timeEnd = {
                    [Op.or]: [
                        { [Op.gte]: now },
                        { [Op.is]: null },
                    ],
                };
                break;

            case 'past':
                where.timeEnd = { [Op.lt]: now };
                break;

            case 'upcoming':
                where.timeBegin = {
                    ...(where.timeBegin || {}),
                    [Op.gt]: now,
                };
                where.isCanceled = false;
                break;

            case 'canceled':
                where.isCanceled = true;
                break;

            case 'all':
            default:
                break;
        }

        const missionModels = await MissionModel.findAll({
            where,
            include: [
                {
                    model: AccountModel,
                    attributes: ['id', 'firstName', 'lastName'],
                    through: { attributes: [] },
                    where: whereAccount,
                    required: !account.isAdmin
                },
                {
                    model: MissionTypeModel,
                    as: 'missionType',
                },
            ],
            order: [['timeBegin', 'DESC']],
            limit: limit ? parseInt(limit as string, 10) : undefined,
        });

        const missions = formatMissions(missionModels);

        res.status(200).json(missions);
    } catch (error) {
        handleHttpError(error, res);
    }
};

export const getCountListMissionsByAccountId = async (req: Request, res: Response): Promise<void> => {
    try {
        const accountId = parseInt(req.params.id, 10);

        if (isNaN(accountId)) {
            throw new BadRequestError(ErrorEnum.INVALID_ID);
        }

        const account = await AccountModel.findByPk(accountId);
        if (!account) {
            throw new NotFoundError(MissionEnum.USER_NOT_FOUND);
        }

        const now = new Date();

        const baseInclude = [
            {
                model: AccountModel,
                attributes: [],
                through: { attributes: [] },
                where: { id: accountId },
            },
        ];

        const allMissionsCount = await MissionModel.count({
            include: baseInclude,
        });

        const activeMissionsCount = await MissionModel.count({
            where: {
                timeBegin: { [Op.lte]: now },
                [Op.or]: [
                    { timeEnd: { [Op.gte]: now } },
                    { timeEnd: { [Op.is]: null } },
                ],
            },
            include: baseInclude,
        });

        const canceledMissionsCount = await MissionModel.count({
            where: {
                isCanceled: true,
            },
            include: baseInclude,
        });

        const pastMissionsCount = await MissionModel.count({
            where: {
                timeEnd: { [Op.lt]: now },
                isCanceled: false,
            },
            include: baseInclude,
        });

        const futureMissionsCount = await MissionModel.count({
            where: {
                timeBegin: { [Op.gt]: now },
                isCanceled: false,
            },
            include: baseInclude,
        });

        res.status(200).json({
            count: {
                all: allMissionsCount,
                actives: activeMissionsCount,
                canceled: canceledMissionsCount,
                past: pastMissionsCount,
                upcoming: futureMissionsCount,
            }
        });

    } catch (error) {
        handleHttpError(error, res);
    }
};

/*
 * Gestion du filtre par période et de la limitation du nombre de résultats :
 *
 * Query params disponibles :
 * - filters=past           → renvoie uniquement les missions passées
 * - filters=current        → renvoie uniquement les missions en cours
 * - filters=future         → renvoie uniquement les missions futures
 * - filters=past,future    → permet de combiner plusieurs filtres
 * - limit=10               → limite le nombre de missions retournées par catégorie
 *
 * Si aucun filtre n'est spécifié, toutes les catégories sont retournées (past, current, future).
 *
 * Exemples d'appels :
 * GET /api/missions/1
 *   → Renvoie toutes les missions (passées, en cours et futures)
 *
 * GET /api/missions/1?filters=past
 *   → Renvoie uniquement les missions passées
 *
 * GET /api/missions/1?filters=current&limit=5
 *   → Renvoie les 5 missions en cours maximum
 *
 * GET /api/missions/1?filters=past,future&limit=2
 *   → Renvoie jusqu’à 2 missions passées et 2 futures
 */
export const getMissionsCategorizedByTime = async (req: Request, res: Response): Promise<void> => {
    try {
        const accountId = parseInt(req.params.id, 10);
        const { filters, limit } = req.query;

        if (isNaN(accountId)) {
            throw new BadRequestError(ErrorEnum.INVALID_ID);
        }

        const account = await AccountModel.findByPk(accountId);
        if (!account) {
            throw new NotFoundError(MissionEnum.USER_NOT_FOUND);
        }

        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const allMissions = await MissionModel.findAll({
            include: [
                {
                    model: AccountModel,
                    where: { id: accountId },
                    attributes: [],
                    through: { attributes: [] }
                },
                {
                    // Personnes assignées à la mission
                    model: AccountModel,
                    attributes: ['id', 'firstName', 'lastName'],
                    through: { attributes: [] }
                },
                {
                    model: PictureModel,
                    as: "pictures",
                    attributes: ["id", "name", "alt", "path"]
                },
                {
                    model: MissionTypeModel,
                    as: "missionType",
                    attributes: ["id", "shortLibel", "longLibel"]
                }
            ]
        });

        const categorized = {
            past: [] as any[],
            current: [] as any[],
            future: [] as any[]
        };

        for (const mission of allMissions) {
            const timeBegin = new Date(mission.timeBegin);
            const estimatedEnd = mission.estimatedEnd ? new Date(mission.estimatedEnd) : null;

            if (estimatedEnd && estimatedEnd < today) {
                categorized.past.push(mission);
            } else if (timeBegin >= tomorrow) {
                categorized.future.push(mission);
            } else {
                categorized.current.push(mission);
            }
        }

        const applyLimit = (missions: any[]) =>
            limit ? missions.slice(0, parseInt(limit as string, 10)) : missions;

        let result: Record<string, any[]> = { past: [], current: [], future: [] };

        if (!filters) {
            result = {
                past: applyLimit(categorized.past),
                current: applyLimit(categorized.current),
                future: applyLimit(categorized.future)
            };
        } else {
            const filtersArray = (filters as string).split(',').map(f => f.trim().toLowerCase());
            if (filtersArray.includes("past")) result.past = applyLimit(categorized.past);
            if (filtersArray.includes("current")) result.current = applyLimit(categorized.current);
            if (filtersArray.includes("future")) result.future = applyLimit(categorized.future);
        }
        res.status(200).json(result);
    } catch (error) {
        handleHttpError(error, res);
    }
};

export const getAllMissionsTypes = async (req: Request, res: Response): Promise<void> => {
    try {
        const missionTypes = await MissionTypeModel.findAll();
        res.status(200).json(missionTypes);
    } catch (error) {
        handleHttpError(error, res);
    }
};

function formatMissions(missionModels: MissionModel[]): (MissionModel & {assignedUsers?: AccountModel[]})[] {
    return missionModels.map((mission: MissionModel & { assignedUsers?: AccountModel[] }) => {
        const assignedUsers = mission.getDataValue("AccountModels").map((account: any) => account);
        mission = mission.get({ plain: true })
        mission['assignedUsers'] = assignedUsers;

        return mission;
    });

}