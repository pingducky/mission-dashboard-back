import { Router } from 'express';
import { register, login } from '../controllers/AuthController';
import { auth } from '../Middleware/authMiddleware';
import { getAccountById } from '../controllers/AccountController';
import {getAllEmployees, getEmployeeById, updateEmployee} from '../controllers/EmployeController';
import { createMission } from '../controllers/MissionController';
import { disableEmployee } from '../controllers/EmployeController';
import upload from '../services/UploadService';

const router = Router();

// [Authentification]
router.post('/register', register);
router.post('/login', login);
// [Account]
router.get('/account/:id', auth, getAccountById);

// [Mission]
router.post("/mission", auth, upload, createMission);

// [Employe]
router.get('/employees', auth, getAllEmployees);
router.get ('/employees/:id', auth, getEmployeeById);
router.patch('/employees/:id', auth, updateEmployee);
router.patch('/employees/:id/disable', auth, disableEmployee);

export default router;
