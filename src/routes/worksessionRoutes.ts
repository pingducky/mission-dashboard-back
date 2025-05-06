import { Router } from "express";
import { auth } from "../middleware/authMiddleware";
import {
    createManualSession,
    getSessionsByMissionId,
    getSessionsWithoutMission,
    pauseWorkSession,
    resumeWorkSession,
    startWorkSession,
    stopWorkSession
} from "../controllers/WorkSessionsController";

const router = Router();

router.post("/start", auth, startWorkSession);

router.post("/:sessionId/pause", auth, pauseWorkSession);

router.post("/:sessionId/resume", auth, resumeWorkSession);

router.post("/:sessionId/stop", auth, stopWorkSession);

router.get("/:idMission/sessions", auth, getSessionsByMissionId);

router.get("/withoutMission", auth, getSessionsWithoutMission);

router.post("/manualSession", auth, createManualSession)

module.exports = router;