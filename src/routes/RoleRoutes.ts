import { Router } from "express";
import { auth } from "../middleware/authMiddleware";
import { createRole, getRoles } from "../controllers/RoleController";

const router = Router();

router.post("/", auth, createRole);
router.get("/", auth, getRoles);

module.exports = router;
