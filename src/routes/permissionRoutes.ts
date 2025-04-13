import { auth } from "../middleware/authMiddleware";
import { createPermission } from "../controllers/PermissionController";
import { Router } from "express";

const router = Router();

router.post("/", auth, createPermission);

module.exports = router;
