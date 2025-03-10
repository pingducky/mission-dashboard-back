import { Router } from 'express';
import { register, login } from '../controllers/AuthController';
import { auth } from '../Middleware/authMiddleware';
import { getAccountById } from '../controllers/AccountController';
import {getAllEmployees, getEmployeeById, updateEmployee} from '../controllers/EmployeController';
import { createMission } from '../controllers/MissionController';
import upload from '../services/UploadService';
import { createRole, getRoles } from '../controllers/RoleController';
import { updateEmployeRole } from '../controllers/EmployeController';

const router = Router();

// [Authentification]
router.post('/register', register);
router.post('/login', login);
// [Account]
router.get('/account/:id', auth, getAccountById);

// [Role]
router.get('/roles', auth, getRoles);

router.post('/role', auth, createRole);

// [Mission]
router.post("/mission", auth, upload, createMission);

// [employés]
router.get('/employees', auth, getAllEmployees);
router.get ('/employees/:id', auth, getEmployeeById);
router.patch('/employees/:id', auth, updateEmployee);
router.patch('/employees/:id/role', auth, updateEmployeRole);


export default router;
