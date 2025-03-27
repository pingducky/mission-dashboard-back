import { Router } from "express";
import upload from "../services/UploadService";
import { createMission, updateMission } from "../controllers/MissionController";
import { auth } from "../middleware/authMiddleware";

const router = Router();

/**
 * @swagger
 * /mission:
 *   post:
 *     summary: Crée une nouvelle mission
 *     description: Cette route permet de créer une nouvelle mission avec des fichiers téléversés et une affectation facultative.
 *     tags:
 *       - Missions
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 description: Description de la mission
 *               timeBegin:
 *                 type: string
 *                 format: date-time
 *                 description: Date et heure de début de la mission
 *               estimatedEnd:
 *                 type: string
 *                 format: date-time
 *                 description: Date et heure estimée de fin de la mission
 *               address:
 *                 type: string
 *                 description: Adresse de la mission
 *               timeEnd:
 *                 type: string
 *                 format: date-time
 *                 description: Date et heure de fin de la mission (optionnelle)
 *               missionTypeId:
 *                 type: integer
 *                 description: Identifiant du type de mission
 *               accountAssignId:
 *                 type: integer
 *                 description: Identifiant du compte assigné (optionnel)
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Fichiers à téléverser
 *     responses:
 *       201:
 *         description: Mission créée avec succès
 *       400:
 *         description: Champs obligatoires manquants ou type de mission invalide
 *       404:
 *         description: Compte assigné non trouvé
 *       500:
 *         description: Erreur serveur lors de la création de la mission
 */
router.post("/", auth, upload, createMission);

router.put("/mission/:id", auth, updateMission);

module.exports = router;
