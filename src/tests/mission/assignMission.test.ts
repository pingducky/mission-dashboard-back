import request from 'supertest';
import app  from '../..';
import { resetDatabase } from '../../utils/databaseUtils';
import { ErrorEnum } from '../../enums/errorEnum';
import sequelize from '../../config/sequelize';
import { generateAuthTokenForTest, generateUserForTest } from '../Utils/TestProvider';
import MissionTypeModel from '../../models/MissionTypeModel';
import { MissionEnum } from '../../controllers/enums/MissionEnum';

let authToken: string;

beforeEach(async () => {
    await resetDatabase();

    authToken = await generateAuthTokenForTest();

    //Création d'un type de mission
    await MissionTypeModel.create({
        id: 1,
        longLibel: "Test Mission Type",
        shortLibel: "Test",
    });

    //Création d'une mission
    await request(app)
        .post('/api/mission')
        .send({
            description: "Good description",
            timeBegin: "2025-02-17T10:00:00Z",
            address: "Good adresse",
            missionTypeId: 1,
        })
        .set("Authorization", `Bearer ${authToken}`);
});

afterAll(async () => {
    await sequelize.close();
})

describe('POST /mission/:id/assign', () => {
    test('Doit assigner une mission à un employé', async () => {
        const response = await request(app)
            .post('/api/mission/1/assign')
            .send({
                idAccounts: [1],
            })
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe(MissionEnum.MISSION_ASSIGNED);
    });

    test('Doit assigner une mission à plusieurs employés', async () => {
        const response = await request(app)
            .post('/api/mission/1/assign')
            .send({
                idAccounts: [1, await generateUserForTest(true), await generateUserForTest()],
            })
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe(MissionEnum.MISSION_ASSIGNED);
    });

    test('Doit renvoyer un erreur, mauvais type de champ', async () => {
        const response = await request(app)
            .post('/api/mission/1/assign')
            .send({
                idAccounts: 1,
            })
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe(ErrorEnum.INVALID_FILED_TYPE);
    });

    test('Doit retourner une erreur si la mission n\'existe pas', async () => {
        const response = await request(app)
            .post('/api/mission/99999/assign')
            .send({
                idAccounts: [1],
            })
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(404);
        expect(response.body.error).toBe(MissionEnum.MISSION_NOT_FOUND);
    });

    test('Doit retourner une erreur si l\'employé n\'existe pas', async () => {
        const response = await request(app)
            .post('/api/mission/1/assign')
            .send({
                idAccounts: [9999],
            })
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(404);
        expect(response.body.error).toBe(MissionEnum.USER_NOT_FOUND);
    });

    test('Doit retourner une erreur si il manque des champs', async () => {
        const response = await request(app)
            .post('/api/mission/1/assign')
            .send()
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe(ErrorEnum.MISSING_REQUIRED_FIELDS);
    });

    test('Doit retourner une erreur, token manquant', async () => {
        const response = await request(app)
            .post('/api/mission/1/assign')
            .send({
                idAccounts: [1],
            })

        expect(response.status).toBe(401);
        expect(response.body.error).toBe(ErrorEnum.PLEASE_AUTHENTICATE);
    });
});