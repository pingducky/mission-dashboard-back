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
import {handleHttpError} from "../services/ErrorService";
import {NotFoundError} from "../Errors/NotFoundError";
import {BadRequestError} from "../Errors/BadRequestError";
import sequelize from "../config/sequelize";

export const createMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const { description, timeBegin, estimatedEnd, address, timeEnd, missionTypeId, accountAssignId } = req.body;
        let accepedUploadedFiles: string[] = [];
        let rejectedUploadFiles: string[] = [];

        // ✅ Vérification des champs obligatoires
        if (!description || !timeBegin || !address || !missionTypeId) {
            throw new BadRequestError(ErrorEnum.MISSING_REQUIRED_FIELDS);
        }

        // ✅ Vérification du type de mission
        const missionType = await MissionTypeModel.findByPk(missionTypeId);
        if (!missionType) {
            throw new BadRequestError(MissionEnum.MISSION_TYPE_DOESNT_EXIST);
        }

        // ✅ Création de la mission
        const newMission = await MissionModel.create({
            description,
            timeBegin,
            timeEnd,
            estimatedEnd,
            address,
            idMissionType: missionTypeId
        });

        console.log(`✅ Mission créée avec succès :`, newMission.toJSON());

        // ✅ Vérification si l'account existe
        if (accountAssignId) {
            console.log('➡️ accountAssignId reçu :', accountAssignId);

            const accountExists = await AccountModel.findByPk(accountAssignId);
            if (accountAssignId) {
                console.log('➡️ accountAssignId reçu :', accountAssignId);

                const accountExists = await AccountModel.findByPk(accountAssignId);
                if (accountExists) {
                    try {
                        const [relation, created] = await AccountMissionAssignModel.findOrCreate({
                            where: {
                                idAccount: accountAssignId,
                                idMission: newMission.id
                            }
                        });

                        console.log('👉 Relation créée :', relation ? relation.toJSON() : 'Aucune relation créée');

                        if (created) {
                            console.log(`✅ Nouvelle relation créée dans la table de jointure :`, relation.toJSON());
                        } else {
                            console.log(`ℹ️ La relation existe déjà, aucune insertion nécessaire.`);
                        }

                        try {
                            await sequelize.query(
                                `INSERT INTO account_mission_assign (idAccount, idMission) VALUES (:idAccount, :idMission)`,
                                {
                                    replacements: {
                                        idAccount: accountAssignId,
                                        idMission: newMission.id
                                    }
                                }
                            );
                            console.log(`✅ Insertion directe réussie !`);
                        } catch (error) {
                            console.error('❌ Erreur lors de l\'insertion directe :', error);
                        }


                    } catch (error) {
                        console.error('❌ Erreur lors de la création de la relation :', error);
                        throw new Error(`Erreur lors de la création de la relation dans la table de jointure`);
                    }
                } else {
                    throw new NotFoundError(MissionEnum.USER_NOT_FOUND);
                }
            }
        }

        // ✅ Upload des fichiers et enregistrement des images associées
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            const { filesUploaded, rejectedFiles } = await uploadFiles(
                req.files as Express.Multer.File[],
                Object.values(IMAGES_MIME_TYPE)
            );

            rejectedUploadFiles = rejectedFiles;
            accepedUploadedFiles = filesUploaded;

            const pictureRecords = filesUploaded.map(filePath => ({
                name: filePath.split("\\").pop(),
                alt: "Image de la mission",
                path: filePath,
                idMission: newMission.id
            }));

            await PictureModel.bulkCreate(pictureRecords);
            console.log(`✅ ${filesUploaded.length} fichiers téléchargés avec succès`);
        }

        // ✅ Réponse avec succès
        res.status(201).json({
            message: MissionEnum.MISSION_SUCCESSFULLY_CREATED,
            mission: { ...newMission.toJSON() },
            rejectedUploadFiles,
            accepedUploadedFiles,
        });
    } catch (error) {
        console.error(`❌ Erreur lors de la création de la mission :`, error);
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
    }
};


export const getMissionsByEmployeeId = async (req: Request, res: Response): Promise<void> => {
    try {
        // ✅ Récupération de l'ID de l'employé depuis le token décodé
        const employeeId = (req as any).token?.id;

        console.log('👤 Utilisateur connecté ID :', employeeId);
        if (!employeeId) {
            res.status(401).json({ message: 'Utilisateur non authentifié' });
            return;
        }

        console.log(`🔎 Récupération des missions pour l'employé ID : ${employeeId}`);

        // ✅ Construction des filtres dynamiques
        const { status, missionTypeId } = req.query;

        const whereCondition: any = {};
        if (status) {
            whereCondition.status = status;
        }
        if (missionTypeId) {
            whereCondition.idMissionType = missionTypeId;
        }

        // ✅ Récupération des missions avec jointure sur AccountModel
        const missions = await MissionModel.findAll({
            where: whereCondition,
            include: [
                {
                    model: MissionTypeModel,
                    as: 'missionType',
                    attributes: ['id', 'shortLibel', 'longLibel'],
                },
                {
                    model: PictureModel,
                    as: 'pictures',
                    attributes: ['id', 'name', 'alt', 'path'],
                },
                {
                    model: AccountModel,
                    as: 'assignedAccounts',
                    through: { attributes: [] },
                    where: { id: employeeId },
                },
            ],
        });

        console.log(`✅ ${missions.length} missions trouvées`);

        res.status(200).json({ missions });
    } catch (error) {
        console.error(`❌ Erreur lors de la récupération des missions :`, error);
        res.status(500).json({ message: 'Erreur lors de la récupération des missions.' });
    }
};