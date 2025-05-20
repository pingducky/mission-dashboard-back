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
        const { idAccount, idMission } = req.body;

        if (!idAccount) {
            throw new BadRequestError(ErrorEnum.MISSING_REQUIRED_FIELDS);
        }

        const account = await AccountModel.findByPk(idAccount);
        if (!account) {
            throw new NotFoundError(ErrorEnum.ACCOUNT_NOT_FOUND);
        }

        if (idMission) {
            const mission = await MissionModel.findByPk(idMission);
            if (!mission) {
                throw new NotFoundError(ErrorEnum.NOT_FOUND);
            }
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

export const getSessionsWithoutMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const idAccount = parseInt(req.params.idAccount, 10);

        if (isNaN(idAccount)) {
            throw new BadRequestError(ErrorEnum.INVALID_ID);
        }

        const account = await AccountModel.findByPk(idAccount);
        if (!account) {
            throw new NotFoundError(ErrorEnum.ACCOUNT_NOT_FOUND);
        }

        const sessions = await WorkSessionModel.findAll({
            where: {
                idMission: null,
                idAccount
            },
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

        const enriched = sessions.map(session => {
            const start = new Date(session.startTime);
            const end = session.endTime ? new Date(session.endTime) : new Date();
            const total = end.getTime() - start.getTime();
            const pauses = session.pauses?.reduce((sum, pause) => {
                if (pause.pauseTime && pause.resumeTime) {
                    return sum + (new Date(pause.resumeTime).getTime() - new Date(pause.pauseTime).getTime());
                }
                return sum;
            }, 0) || 0;

            return {
                ...session.toJSON(),
                totalDuration: formatDuration(total),
                totalPause: formatDuration(pauses),
                netWorkDuration: formatDuration(total - pauses)
            };
        });

        res.status(200).json({ sessions: enriched });
    } catch (error) {
        handleHttpError(error, res);
    }
};

export const createManualSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const { idAccount, idMission, startTime, endTime, pauses } = req.body;

        if (!idAccount || !startTime || !endTime) {
            throw new BadRequestError(ErrorEnum.MISSING_REQUIRED_FIELDS);
        }

        const account = await AccountModel.findByPk(idAccount);
        if (!account) throw new NotFoundError(ErrorEnum.ACCOUNT_NOT_FOUND);

        if (idMission) {
            const mission = await MissionModel.findByPk(idMission);
            if (!mission) throw new NotFoundError(ErrorEnum.NOT_FOUND);
        }

        const session = await WorkSessionModel.create({
            idAccount,
            idMission: idMission || null,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            status: WorkSessionStatusEnum.ENDED
        });

        const createdPauses = [];

        if (Array.isArray(pauses)) {
            for (const pause of pauses) {
                if (!pause.pauseTime || !pause.resumeTime) continue;
                const newPause = await WorkSessionPauseModel.create({
                    idWorkSession: session.id,
                    pauseTime: new Date(pause.pauseTime),
                    resumeTime: new Date(pause.resumeTime)
                });
                createdPauses.push(newPause);
            }
        }

        res.status(201).json({
            message: "Session manuelle créée",
            session,
            pauses: createdPauses
        });
    } catch (error) {
        handleHttpError(error, res);
    }
};

export const getLatestSessionByAccountId = async (req: Request, res: Response): Promise<void> => {
    try {
        const idAccount = parseInt(req.params.idAccount, 10);

        if (isNaN(idAccount)) {
            throw new NotFoundError(ErrorEnum.INVALID_ID);
        }

        const account = AccountModel.findByPk(idAccount)
        if (!account) {
            throw new NotFoundError(ErrorEnum.ACCOUNT_NOT_FOUND);
        }

        const session = await WorkSessionModel.findOne({
            where: { idAccount, endTime: null },
            order: [["startTime", "DESC"]],
            limit: 1,
            include: [
                {
                    model: MissionModel,
                    required: true,
                    attributes: ["description"],
                    where: {
                        isCanceled: false
                    }
                }
            ]
        });
        
        if (!session) {
            res.status(204).json();
            return;
        }

        const description = session.getDataValue("MissionModel")["description"];

        let sessionMission = session.get({ plain: true });
        delete sessionMission["MissionModel"];
        sessionMission["description"] = description;

        res.status(200).json(sessionMission);
    } catch (error) {
        handleHttpError(error, res);
    }
}

export const getSessionsByAccountIdAndDateRange = async (req: Request, res: Response): Promise<void> => {
    try {
        const accountId = parseInt(req.params.idAccount, 10);
        const { from, to, limit } = req.query;

        if (isNaN(accountId)) {
            throw new BadRequestError(ErrorEnum.INVALID_ID);
        }

        const account = await AccountModel.findByPk(accountId);
        if (!account) {
            throw new NotFoundError(ErrorEnum.ACCOUNT_NOT_FOUND);
        }

        const where: any = {
            idAccount: accountId
        };

        if (from) {
            where.startTime = { [Op.gte]: new Date(from as string) };
        }

        if (to) {
            where.startTime = {
                ...(where.startTime || {}),
                [Op.lte]: new Date(to as string)
            };
        }

        const sessions = await WorkSessionModel.findAll({
            where,
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
            order: [["startTime", "DESC"]],
            limit: limit ? parseInt(limit as string, 10) : undefined
        });

        const enrichedSessions = sessions.map(session => {
            const startTime = new Date(session.startTime);
            const endTime = session.endTime ? new Date(session.endTime) : new Date();

            const totalDurationMs = endTime.getTime() - startTime.getTime();

            const totalPauseMs = session.pauses?.reduce((acc: number, pause: any) => {
                if (pause.pauseTime && pause.resumeTime) {
                    return acc + (new Date(pause.resumeTime).getTime() - new Date(pause.pauseTime).getTime());
                }
                return acc;
            }, 0) || 0;

            const effectiveDurationMs = totalDurationMs - totalPauseMs;

            return {
                ...session.toJSON(),
                totalDuration: formatDuration(totalDurationMs),
                totalPause: formatDuration(totalPauseMs),
                effectiveDuration: formatDuration(effectiveDurationMs)
            };
        });

        res.status(200).json({
            accountId,
            sessions: enrichedSessions
        });
    } catch (error) {
        handleHttpError(error, res);
    }
};
