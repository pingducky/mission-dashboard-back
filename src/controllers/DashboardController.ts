import { Request, Response } from 'express';
import { Op } from 'sequelize';
import AccountModel from '../models/AccountModel';
import MissionModel from '../models/MissionModel';
import {handleHttpError} from "../services/ErrorService";

export const getDashboardSummary = async (req: Request, res: Response) => {
    try {
        // Nombre total d'employés (uniquement ceux qui sont actifs)
        const employeeCount = await AccountModel.count({
            where: {
                isEnabled: true
            }
        });

        // Nombre de missions terminées (celle qui ont une date de fin)
        const missionsDone = await MissionModel.count({
            where: {
                timeEnd: {
                    [Op.not]: null
                }
            }
        });

        // Missions prévues aujourd'hui
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const missionsToday = await MissionModel.count({
            where: {
                timeBegin: {
                    [Op.between]: [startOfDay, endOfDay]
                }
            }
        });

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