import { Router } from "express";
import { login, register, disconnect } from "../controllers/AuthController";

const router = Router();

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     description: This endpoint allows a user to register with their details such as first name, last name, email, password, and phone number.
 *     tags:
 *       - Authentification
 *     parameters:
 *       - in: body
 *         name: user
 *         description: The user registration details.
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             firstName:
 *               type: string
 *               description: User's first name.
 *               example: "John"
 *             lastName:
 *               type: string
 *               description: User's last name.
 *               example: "Doe"
 *             email:
 *               type: string
 *               description: User's email address.
 *               example: "john.doe@example.com"
 *             password:
 *               type: string
 *               description: User's password.
 *               example: "securePassword123"
 *             phoneNumber:
 *               type: string
 *               description: User's phone number.
 *               example: "+1234567890"
 *     responses:
 *       201:
 *         description: User successfully registered.
 *         schema:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *               description: The token generated for the user.
 *               example: "jwt-token-string"
 *       400:
 *         description: Bad Request - Missing required fields or unexpected error.
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               description: Error message.
 *               example: "Missing required fields."
 *       500:
 *         description: Unexpected error during registration.
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               description: Error message.
 *               example: "Unexpected error."
 */
router.post('/register', register);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login an existing user
 *     description: This endpoint allows a user to log in with their email and password to receive an authentication token.
 *     tags:
 *       - Authentification
 *     parameters:
 *       - in: body
 *         name: login
 *         description: The login credentials (email and password).
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *               description: User's email address.
 *               example: "john.doe@example.com"
 *             password:
 *               type: string
 *               description: User's password.
 *               example: "securePassword123"
 *     responses:
 *       200:
 *         description: Successfully logged in and received a token.
 *         schema:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *               description: The authentication token generated for the user.
 *               example: "jwt-token-string"
 *       400:
 *         description: Bad Request - Missing required fields or unexpected error.
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               description: Error message.
 *               example: "Missing required fields."
 *       500:
 *         description: Unexpected error during login.
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               description: Error message.
 *               example: "Unexpected error."
 */
router.post('/login', login);

/**
 * @swagger
 * /disconnect:
 *   post:
 *     summary: Disconnect a connected user
 *     description: This endpoint allows a user to log out.
 *     tags:
 *       - Authentification
 *     responses:
 *       200:
 *         description: Successfully logged out
 *       500:
 *         description: Unexpected error during logout.
 *         schema:
 *           type: object
 *           properties:
 *             error:
 *               type: string
 *               description: Error message.
 *               example: "Unexpected error."
 */
router.post('/disconnect', disconnect)

module.exports = router;
