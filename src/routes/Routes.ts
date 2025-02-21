import { Router } from 'express';
import { register, login } from '../controllers/AuthController';
import { auth } from '../middleware/authMiddleware';
import { getAccountById } from '../controllers/AccountController';
import { createRole, getRoles } from '../controllers/RoleController';
import { updateEmployeRole } from '../controllers/EmployeController';

const router = Router();

// Route d'enregistrement
router.post('/register', register);

// Route de connexion
router.post('/login', login);

// Route Comptes
router.get('/account/:id', auth, getAccountById);

// Routes Roles
router.get('/roles', auth, getRoles);

router.post('/role', auth, createRole);

// Routes Employes
router.patch('/employees/:id/role', auth, updateEmployeRole);

export default router;
