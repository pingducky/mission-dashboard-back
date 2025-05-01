import {Router} from "express";
import {auth} from "../middleware/authMiddleware";
import {getAllMissionsTypes} from "../controllers/MissionTypeController";

const router = Router();

router.get("/", auth, getAllMissionsTypes);

module.exports = router;