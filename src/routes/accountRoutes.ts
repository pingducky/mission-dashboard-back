import { Router } from "express";
import { auth } from "../middleware/authMiddleware";
import { getAccountByToken } from "../controllers/AccountController";

const router = Router();

router.get("/token/:token", auth, getAccountByToken);

module.exports = router;
