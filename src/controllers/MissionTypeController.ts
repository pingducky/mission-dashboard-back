import {Request, Response} from "express";
import MissionTypeModel from "../models/MissionTypeModel";
import {handleHttpError} from "../services/ErrorService";

export const getAllMissionsTypes = async (req: Request, res: Response): Promise<void> => {
    try {
        const missionTypes = await MissionTypeModel.findAll({
            attributes: ['id', 'shortLibel', 'longLibel']
        });

        res.status(200).json({ missionTypes });
    } catch (error) {
        handleHttpError(error, res);
    }
};