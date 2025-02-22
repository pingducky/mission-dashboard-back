import { Router } from 'express';
import { register, login } from '../controllers/AuthController';
import { auth } from '../middleware/authMiddleware';
import { getAccountById } from '../controllers/AccountController';
import { createMission } from '../controllers/MissionController';
import upload from '../services/UploadService';

const router = Router();

// [Authentification]
router.post('/register', register);
router.post('/login', login);
// [Account]
router.get('/account/:id', auth, getAccountById);

// [Mission]
router.post("/mission", auth, upload, createMission);

export default router;
