import { Request, Response } from "express";
import WorkSessionModel, {WorkSessionStatusEnum} from "../models/WorkSessionModel";
import { BadRequestError } from "../Errors/BadRequestError";
import { NotFoundError } from "../Errors/NotFoundError";
import AccountModel from "../models/AccountModel";
import MissionModel from "../models/MissionModel";
import { ErrorEnum } from "../enums/errorEnum";
import {handleHttpError} from "../services/ErrorService";
import WorkSessionPauseModel from "../models/WorkSessionPauseModel";
import {WorkSessionEnum} from "./enums/WorkSessionEnum";
import {Op} from "sequelize";

export const startWorkSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const idAccount = (req as any).user?.id;
        const idMission = parseInt(req.params.idMission, 10);

        if (!idAccount || isNaN(idMission)) {
            throw new BadRequestError(ErrorEnum.MISSING_REQUIRED_FIELDS);
        }

        const account = await AccountModel.findByPk(idAccount);
        if (!account) {
            throw new NotFoundError(ErrorEnum.ACCOUNT_NOT_FOUND);
        }

        const mission = await MissionModel.findByPk(idMission);
        if (!mission) {
            throw new NotFoundError(ErrorEnum.NOT_FOUND);
        }

        const existingActiveSession = await WorkSessionModel.findOne({
            where: {
                idAccount,
                status: { [Op.in]: [WorkSessionStatusEnum.STARTED, WorkSessionStatusEnum.PAUSED] }
            }
        });

        if (existingActiveSession) {
            throw new BadRequestError(WorkSessionEnum.WORK_SESSION_ALREADY_ACTIVE);
        }

        const newSession = await WorkSessionModel.create({
            idAccount,
            idMission: idMission,
            startTime: new Date(),
            status: WorkSessionStatusEnum.STARTED,
        });

        res.status(201).json({
            message: "Session démarrée",
            session: newSession
        });
    } catch (error) {
        handleHttpError(error, res);
    }
};

export const pauseWorkSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const sessionId = parseInt(req.params.sessionId, 10);
        if (isNaN(sessionId)) throw new BadRequestError(WorkSessionEnum.WORK_SESSION_INVALIDE_ID);

        const session = await WorkSessionModel.findByPk(sessionId);
        if (!session || session.status !== WorkSessionStatusEnum.STARTED) {
            throw new BadRequestError(WorkSessionEnum.WORK_SESSION_PAUSE);
        }

        const existingPause = await WorkSessionPauseModel.findOne({
            where: {
                idWorkSession: sessionId,
                resumeTime: null
            }
        });

        if (existingPause) {
            throw new BadRequestError(WorkSessionEnum.WORK_SESSION_ALREADY_PAUSED);
        }

        // Crée une nouvelle pause
        const newPause = await WorkSessionPauseModel.create({
            idWorkSession: sessionId,
            pauseTime: new Date(),
            resumeTime: null
        });

        session.status = WorkSessionStatusEnum.PAUSED;
        await session.save();

        res.status(200).json({
            message: "Session mise en pause",
            session,
            newPause
        });
    } catch (error) {
        handleHttpError(error, res);
    }
};

export const resumeWorkSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const sessionId = parseInt(req.params.sessionId, 10);
        if (isNaN(sessionId)) throw new BadRequestError(WorkSessionEnum.WORK_SESSION_INVALIDE_ID);

        const session = await WorkSessionModel.findByPk(sessionId);
        if (!session || session.status !== WorkSessionStatusEnum.PAUSED) {
            throw new BadRequestError(WorkSessionEnum.WORK_SESSION_RESUME);
        }

        // Trouver la dernière pause sans resumeTime
        const lastPause = await WorkSessionPauseModel.findOne({
            where: {
                idWorkSession: sessionId,
                resumeTime: null
            },
            order: [["pauseTime", "DESC"]]
        });

        if (!lastPause) {
            throw new BadRequestError(WorkSessionEnum.WORK_SESSION_NOT_FIND_PAUSE_SESSION);
        }

        lastPause.resumeTime = new Date();
        await lastPause.save();

        session.status = WorkSessionStatusEnum.STARTED;
        await session.save();

        res.status(200).json({
            message: "Session reprise",
            session,
            lastPause
        });
    } catch (error) {
        handleHttpError(error, res);
    }
};

export const stopWorkSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const sessionId = parseInt(req.params.sessionId, 10);
        if (isNaN(sessionId)) {
            throw new BadRequestError(WorkSessionEnum.WORK_SESSION_INVALIDE_ID);
        }

        const session = await WorkSessionModel.findByPk(sessionId);
        if (!session || session.status === WorkSessionStatusEnum.ENDED) {
            throw new BadRequestError(WorkSessionEnum.WORK_SESSION_STOP);
        }

        session.endTime = new Date();
        session.status = WorkSessionStatusEnum.ENDED;
        await session.save();

        const pauses = await WorkSessionPauseModel.findAll({
            where: { idWorkSession: sessionId },
            order: [["pauseTime", "ASC"]]
        });

        res.status(200).json({
            message: "Session arrêtée",
            session,
            pauses
        });
    } catch (error) {
        handleHttpError(error, res);
    }
};


//Formatte une durée (en ms) en hh:mm:ss
const formatDuration = (durationMs: number): string => {
    const totalSeconds = Math.floor(durationMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export const getSessionsByMissionId = async (req: Request, res: Response): Promise<void> => {
    try {
        const idMission = parseInt(req.params.idMission, 10);
        if (isNaN(idMission)) {
            throw new NotFoundError(ErrorEnum.INVALID_ID);
        }

        const mission = await MissionModel.findByPk(idMission);
        if (!mission) {
            throw new NotFoundError(ErrorEnum.NOT_FOUND);
        }

        const sessions = await WorkSessionModel.findAll({
            where: { idMission },
            include: [
                {
                    model: AccountModel,
                    attributes: ["id", "firstName", "lastName"]
                },
                {
                    model: WorkSessionPauseModel,
                    as: "pauses",
                    attributes: ["id", "pauseTime", "resumeTime"],
                    order: [["pauseTime", "ASC"]]
                }
            ],
            order: [["startTime", "DESC"]]
        });

        const enrichedSessions = sessions.map(session => {
            const startTime = new Date(session.startTime);
            const endTime = session.endTime ? new Date(session.endTime) : new Date();

            const totalDurationMs = endTime.getTime() - startTime.getTime();

            const totalPauseMs = session.pauses?.reduce((acc: number, pause: any) => {
                if (pause.pauseTime && pause.resumeTime) {
                    const pauseStart = new Date(pause.pauseTime);
                    const pauseEnd = new Date(pause.resumeTime);
                    return acc + (pauseEnd.getTime() - pauseStart.getTime());
                }
                return acc;
            }, 0) || 0;

            const netWorkDurationMs = totalDurationMs - totalPauseMs;

            return {
                ...session.toJSON(),
                totalDuration: formatDuration(totalDurationMs),
                totalPause: formatDuration(totalPauseMs),
                netWorkDuration: formatDuration(netWorkDurationMs)
            };
        });

        res.status(200).json({
            missionId: idMission,
            sessions: enrichedSessions
        });
    } catch (error) {
        handleHttpError(error, res);
    }
};