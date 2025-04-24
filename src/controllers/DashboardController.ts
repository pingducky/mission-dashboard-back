import { Request, Response } from 'express';
import { Op } from 'sequelize';
import AccountModel from '../models/AccountModel';
import MissionModel from '../models/MissionModel';
import AccountMissionAssignModel from '../models/AccountMissionAssignModel';
import AccountRoleModel from '../models/AccountRoleModel';
import RoleModel from '../models/RoleModel';
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

        // Vérifie si l'utilisateur est un admin
        const roles = await AccountRoleModel.findAll({
            where: { idAccount: accountId },
            include: [{
                model: RoleModel,
                as: "role",
                attributes: ['shortLibel']
            }]
        });

        const isAdmin = roles.some(role => (role as any).role?.shortLibel === 'ADMIN');

        // Nombre total d'employés (uniquement ceux qui sont actifs)
        const employeeCount = await AccountModel.count({ where: { isEnabled: true } });

        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        let missionsDone: number;
        let missionsToday: number;

        if (isAdmin) {
            // Nombre de missions terminées (celle qui ont une date de fin, parmi tous les utilisateurs)
            missionsDone = await MissionModel.count({
                where: {
                    timeEnd: { [Op.not]: null }
                }
            });

            // Compte les missions prévues pour aujourd’hui (parmi tous les utilisateurs)
            missionsToday = await MissionModel.count({
                where: {
                    timeBegin: { [Op.between]: [startOfDay, endOfDay] }
                }
            });
        } else {
            // Utilisateur sans privileges
            const missionLinks = await AccountMissionAssignModel.findAll({
                where: { idAccount: accountId },
                attributes: ['idMission']
            });

            const missionIds = missionLinks.map(link => link.idMission);

            // Nombre de missions terminées (celle qui ont une date de fin pour l'utilisateur connecté)
            missionsDone = await MissionModel.count({
                where: {
                    id: { [Op.in]: missionIds },
                    timeEnd: { [Op.not]: null }
                }
            });

            // Compte les missions prévues pour aujourd’hui (parmi l'utilisateur connecté)
            missionsToday = await MissionModel.count({
                where: {
                    id: { [Op.in]: missionIds },
                    timeBegin: { [Op.between]: [startOfDay, endOfDay] }
                }
            });
        }

        res.json({
            employeeCount,
            missionsDone,
            missionsToday,
            workingTimeToday: "8h30"
        });
    } catch (error: unknown) {
        handleHttpError(error, res);
    }
};