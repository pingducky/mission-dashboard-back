import request from 'supertest';
import sequelize from "../config/sequelize";
import { resetDatabase, resetTable } from "../utils/databaseUtils";
import app from "..";
import { ErrorEnum } from '../enums/errorEnum';
import MissionTypeModel from '../models/MissionTypeModel';
import { MissionEnum } from '../controllers/enums/MissionEnum';

let authToken: string;

beforeEach(async () => {
    await resetTable('MissionModel');
  });

beforeAll(async () => {
    await resetDatabase();

    const userResponse = await request(app)
    .post("/api/register")
    .send({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        password: "password123",
        phoneNumber: "1234567890",
    });

    authToken = userResponse.body.token;

    await MissionTypeModel.create({
        id: 1,
        longLibel: "Test Mission Type",
        shortLibel: "Test"
    });
})

  afterAll(async () => {
    await sequelize.close();
  })
  
  describe('Création d\'une mission', () => {
    test('Test des champs obligatoires manquants', async () => {
        const response = await request(app)
            .post('/api/mission')
            .send({})
            .set("Authorization", `Bearer ${authToken}`)
        

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(ErrorEnum.MISSING_REQUIRED_FIELDS);
    })

    test('Test de création de mission sans les champs facultatif', async () => {
        const response = await request(app)
        .post('/api/mission')
        .send({
            description: "Good description",
            timeBegin: "2025-02-17T10:00:00Z",
            address: "Good adresse",
            missionTypeId: 1,
        })
        .set("Authorization", `Bearer ${authToken}`)
        expect(response.body.message).toEqual(MissionEnum.MISSION_SUCCESSFULLY_CREATED)
    })

    test('Test de création de mission avec tout les champs facultatif ou non facultatif', async () => {
            const response = await request(app)
            .post('/api/mission')
            .send({
                description: "Good description",
                timeBegin: "2025-02-17T10:00:00Z",
                estimatedEnd: "2025-02-17T10:00:00Z",
                timeEnd: "2025-02-17T10:00:00Z",
                address: "Good adresse",
                accountAssignId: 666,
                accountAssignId: 1,
                missionTypeId: 1,
            })
            .set("Authorization", `Bearer ${authToken}`)
    })

    test('Test de création de mission avec un accountAssignId qui ne correspond à aucun compte', async () => {
        const response = await request(app)
        .post('/api/mission')
        .send({
            description: "Good description",
            timeBegin: "2025-02-17T10:00:00Z",
            address: "Good adresse",
            accountAssignId: 666,
            missionTypeId: 1,
        })
        .set("Authorization", `Bearer ${authToken}`)
        expect(response.body.accountAssignationWarningMessage).toEqual(ErrorEnum.ACCOUNT_NOT_FOUND)
    })

    test('Test de création de mission avec un type de mission inexistant', async () => {
        const response = await request(app)
        .post('/api/mission')
        .send({
            description: "Good description",
            timeBegin: "2025-02-17T10:00:00Z",
            address: "Good adresse",
            accountAssignId: 666,
            missionTypeId: 10,
        })
        .set("Authorization", `Bearer ${authToken}`)
        
        expect(response.body.message).toEqual(MissionEnum.MISSION_TYPE_DOSNT_EXIST)
    })
});