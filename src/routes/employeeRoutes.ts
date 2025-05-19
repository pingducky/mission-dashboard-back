import { Router } from "express";
import { createEmployee, disableEmployee, activateEmployee, getAllEmployees, getEmployeeById, updateEmployee } from "../controllers/EmployeController";
import { auth } from "../middleware/authMiddleware";
import { updateEmployeRole } from "../controllers/RoleController";

const router = Router();

/**
 * @swagger
 * /employees:
 *   get:
 *     summary: Récupère la liste de tous les employés
 *     tags:
 *       - Employees
 *     description: Retourne une liste de tous les employés enregistrés dans la base de données.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des employés récupérée avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Employee'
 *       400:
 *         description: Erreur lors de la récupération des employés.
 */
router.get('/', auth, getAllEmployees);

/**
 * @swagger
 * /employees/{id}:
 *   get:
 *     summary: Récupère un employé par son ID
 *     description: Retourne les informations d'un employé en fonction de son ID.
 *     tags:
 *       - Employees
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'employé à récupérer
 *     responses:
 *       200:
 *         description: Succès - Retourne les informations de l'employé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Requête invalide (ID non valide ou erreur inattendue)
 *       404:
 *         description: Employé non trouvé
 */
router.get ('/:id', auth, getEmployeeById);

/**
 * @swagger
 * /employees/{id}:
 *   patch:
 *     summary: Met à jour un employé
 *     description: Met à jour les informations d'un employé en fonction de son ID.
 *     tags:
 *       - Employees
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'employé à mettre à jour
 *       - in: body
 *         name: updateData
 *         required: true
 *         schema:
 *           type: object
 *         description: Données à mettre à jour
 *     responses:
 *       200:
 *         description: Succès - Retourne l'employé mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Requête invalide (données manquantes ou non valides)
 *       404:
 *         description: Employé non trouvé
 */
router.patch('/:id', auth, updateEmployee);

router.put('/:id/disable', auth, disableEmployee);

router.put('/:id/activate', auth, activateEmployee);

router.patch("/:id/role", auth, updateEmployeRole);

router.post("/", auth, createEmployee);

module.exports = router;
