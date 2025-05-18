import { Router } from "express";
import { auth } from "../middleware/authMiddleware";
import {
    createManualSession,
    getLatestSessionByAccountId,
    getSessionsByMissionId,
    getSessionsWithoutMission,
    pauseWorkSession,
    resumeWorkSession,
    startWorkSession,
    stopWorkSession
} from "../controllers/WorkSessionsController";

const router = Router();

router.post("/start", startWorkSession);

router.post("/:sessionId/pause", pauseWorkSession);

router.post("/:sessionId/resume", resumeWorkSession);

router.post("/:sessionId/stop", stopWorkSession);

router.get("/:idMission/sessions", getSessionsByMissionId);

router.get("/withoutMission/:idAccount", getSessionsWithoutMission);

router.post("/manualSession", createManualSession)

router.get("/latest/:idAccount", auth, getLatestSessionByAccountId);

module.exports = router;