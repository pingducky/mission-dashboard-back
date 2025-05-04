import { Router } from "express";
import { auth } from "../middleware/authMiddleware";
import {
    getSessionsByMissionId,
    pauseWorkSession,
    resumeWorkSession,
    startWorkSession,
    stopWorkSession
} from "../controllers/WorkSessionsController";

const router = Router();

router.post("/:idMission/start", auth, startWorkSession);

router.post("/:sessionId/pause", auth, pauseWorkSession);

router.post("/:sessionId/resume", auth, resumeWorkSession);

router.post("/:sessionId/stop", auth, stopWorkSession);

router.get("/:idMission/sessions", auth, getSessionsByMissionId);

module.exports = router;
