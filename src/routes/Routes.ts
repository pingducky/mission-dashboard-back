import { Router } from 'express';
import { register, login } from '../controllers/AuthController';
import { auth } from '../middleware/authMiddleware';
import { getAccountById } from '../controllers/AccountController';

const router = Router();

// Route d'enregistrement
router.post('/register', register);

// Route de connexion
router.post('/login', login);

router.get('/account/:id', auth, getAccountById);

export default router;
