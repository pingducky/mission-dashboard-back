import { Router } from 'express';
import { register, login } from '../controllers/AuthController';
import { auth } from '../Middleware/authMiddleware';
import { getAccountById } from '../controllers/AccountController';
import {getAllEmployees, getEmployeeById, updateEmployee} from '../controllers/EmployeController';

const router = Router();

// Route d'enregistrement
router.post('/register', register);

// Route de connexion
router.post('/login', login);

router.get('/account/:id', auth, getAccountById);

// employés
router.get('/employees', auth, getAllEmployees);

router.patch('/employees/:id', auth, updateEmployee);

router.get ('/employees/:id', auth, getEmployeeById);

export default router;
