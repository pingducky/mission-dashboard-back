import { Request, Response } from 'express';
import { Op } from 'sequelize';
import AccountModel from '../models/AccountModel';
import MissionModel from '../models/MissionModel';
import AccountMissionAssignModel from '../models/AccountMissionAssignModel';
import { handleHttpError } from "../services/ErrorService";
import { CustomRequest } from '../middleware/authMiddleware';
import {BadRequestError} from "../Errors/BadRequestError";
import {ErrorEnum} from "../enums/errorEnum";

export const getDashboardSummary = async (req: Request, res: Response): Promise<void> => {
    try {
        const accountId = (req as CustomRequest).user?.id;

        if (!accountId) {
            throw new BadRequestError(ErrorEnum.ACCOUNT_NOT_FOUND);
        }

        // Récupère le compte pour vérifier s'il est Admin
        const account = await AccountModel.findByPk(accountId);

        if (!account) {
            throw new BadRequestError(ErrorEnum.ACCOUNT_NOT_FOUND);
        }

        const isAdmin = account.isAdmin;

        // Nombre total d'employés actifs
        const employeeCount = await AccountModel.count({ where: { isEnabled: true } });

        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        let missionsDoneCount: number;
        let missionsTodayCount: number;

        if (isAdmin) {
            // Nombre de missions terminées (celle qui ont une date de fin, parmi tous les utilisateurs)
            missionsDoneCount = await MissionModel.count({
                where: {
                    timeEnd: { [Op.not]: null }
                }
            });

            // Compte les missions prévues pour aujourd’hui (parmi tous les utilisateurs)
            missionsTodayCount = await MissionModel.count({
                where: {
                    timeBegin: { [Op.between]: [startOfDay, endOfDay] }
                }
            });
        } else {
            // Récupère toutes les missions assignées à l'utilisateur connecté
            const missionLinks = await AccountMissionAssignModel.findAll({
                where: { idAccount: accountId },
                attributes: ['idMission']
            });

            // Récupère les IDs des missions assignées à l'utilisateur
            const missionIds = missionLinks.map(link => link.idMission);

            // Nombre de missions terminées (celle qui ont une date de fin, parmi l'utilisateur connecté)
            missionsDoneCount = await MissionModel.count({
                where: {
                    id: { [Op.in]: missionIds },
                    timeEnd: { [Op.not]: null }
                }
            });

            // Compte les missions prévues pour aujourd’hui (parmi l'utilisateur connecté)
            missionsTodayCount = await MissionModel.count({
                where: {
                    id: { [Op.in]: missionIds },
                    timeBegin: { [Op.between]: [startOfDay, endOfDay] }
                }
            });
        }

        res.json({
            employeeCount,
            missionsDoneCount,
            missionsTodayCount,
            workingTimeToday: "8h30"
        });
    } catch (error: unknown) {
        handleHttpError(error, res);
    }
};