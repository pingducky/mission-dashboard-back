import request from "supertest";
import app from '../../app';
import { resetDatabase } from "../../utils/databaseUtils";
import { ErrorEnum } from "../../enums/errorEnum";
import sequelize from "../../config/sequelize";
import { PermissionMessageEnum } from "../../controllers/enums/PermissionMessageEnum";
import { generateAuthTokenForTest } from "../Utils/TestProvider";

let authToken: string;

beforeEach(async () => {
    await resetDatabase();

    authToken = await generateAuthTokenForTest();
});

afterAll(async () => {
    await sequelize.close();
});

describe('POST /permission', () => {
    test('Doit créer un permission', async () => {
        const response = await request(app)
            .post("/api/permission")
            .send({
                shortLibel: 'test',
                longLibel: 'test',
            })
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(201);
        expect(response.body.message).toEqual(PermissionMessageEnum.PERMISSION_CREATED);
    });

    test('Doit retourner une erreur, champ manquant', async () => {
        const response = await request(app)
            .post("/api/permission")
            .send({
                shortLibel: 'test',
            })
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual(ErrorEnum.MISSING_REQUIRED_FIELDS);
    });

    test('Doit demander la connection', async () => {
        const response = await request(app)
            .post("/api/permission")
            .send({
                shortLibel: 'test',
                longLibel: 'test',
            });

        expect(response.status).toBe(401);
    });

    test('Doit retourner une erreur, taille de champs invalide', async () => {
        const response = await request(app)
            .post("/api/permission")
            .send({
                shortLibel: 'admin'.repeat(10),
                longLibel: 'administrateur'.repeat(10),
            })
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual(ErrorEnum.INVALID_FIELDS_LENGTH);
    });
});