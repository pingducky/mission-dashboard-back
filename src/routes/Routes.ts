import { Router } from 'express';
import { register, login } from '../controllers/AuthController';
import { auth } from '../Middleware/authMiddleware';
import { getAccountById } from '../controllers/AccountController';
import {createMission, getMissionDetails} from '../controllers/MissionController';
import upload from '../services/UploadService';

const router = Router();

// Route d'enregistrement
router.post('/register', register);

// Route de connexion
router.post('/login', login);

router.get('/account/:id', auth, getAccountById);

router.post("/missions", auth, upload, createMission);

router.get("/missions/:missionId", getMissionDetails);

export default router;
