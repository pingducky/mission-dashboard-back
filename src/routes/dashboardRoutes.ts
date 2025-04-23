import {Router} from "express";
import {auth} from "../middleware/authMiddleware";
import {getDashboardSummary} from "../controllers/DashboardController";

const router = Router();

router.get("/", auth, getDashboardSummary);

module.exports = router;