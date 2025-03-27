import { Router } from 'express';
import { register, login } from '../controllers/AuthController';
import { auth } from '../Middleware/authMiddleware';
import {getAllEmployees, getEmployeeById, updateEmployee} from '../controllers/EmployeController';
import {addCommentToMission, createMission, getMissionById} from '../controllers/MissionController';
import upload from '../services/UploadService';

const router = Router();

// [Authentification]
router.post('/register', register);
router.post('/login', login);

// [Mission]
router.post("/mission", auth, upload, createMission);
router.get('/mission/:id', auth, getMissionById);
router.post('/mission/:id/comment', auth, addCommentToMission)

// [employés]
router.get('/employees', auth, getAllEmployees);
router.get ('/employees/:id', auth, getEmployeeById);
router.patch('/employees/:id', auth, updateEmployee);

export default router;
