import { Router } from "express";
import { getFileByAccountId } from "../controllers/FileController";
import { auth } from "../middleware/authMiddleware";

const router = Router();


router.get('/account/:id', auth, getFileByAccountId)

module.exports = router;