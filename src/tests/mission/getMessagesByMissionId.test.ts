import request from 'supertest';
import sequelize from '../../config/sequelize';
import { resetDatabase } from '../../utils/databaseUtils';
import app from '../..';
import { ErrorEnum } from '../../enums/errorEnum';
import { MissionEnum } from '../../controllers/enums/MissionEnum';
import MissionTypeModel from '../../models/MissionTypeModel';
import MissionModel from '../../models/MissionModel';
import MessageModel from '../../models/MessageModel';
import AccountModel from '../../models/AccountModel';
import { generateAuthTokenForTest } from '../Utils/TestProvider';

let authToken: string;
let createdMissionId: number;
let createdAccountId: number;

beforeAll(async () => {
    await resetDatabase();
    authToken = await generateAuthTokenForTest();

    // Crée un type de mission
    await MissionTypeModel.create({
        id: 1,
        longLibel: "Type test",
        shortLibel: "TT"
    });

    // Crée un compte avec les champs obligatoires
    const account = await AccountModel.create({
        firstName: "John",
        lastName: "Doe",
        email: "jondoe@example.com",
        password: "securepassword",
        address: "123 Main St",
        postalCode: "12345",
        city: "Paris",
        hiringDate: new Date("2024-04-14T12:00:00Z"),
        phoneNumber: "0123456789",
    });
    createdAccountId = account.id;

    // Crée une mission
    const mission = await MissionModel.create({
        description: "Mission test",
        timeBegin: "2025-04-14T12:00:00Z",
        address: "1 rue du test",
        idMissionType: 1
    });
    createdMissionId = mission.id;

    // Crée deux messages avec des timestamps précis
    await MessageModel.create({
        message: "Premier message",
        idMission: createdMissionId,
        idAccount: createdAccountId,
        createdAt: new Date("2025-04-14T10:00:00Z"),
        updatedAt: new Date("2025-04-14T10:00:00Z")
    });

    await MessageModel.create({
        message: "Deuxième message",
        idMission: createdMissionId,
        idAccount: createdAccountId,
        createdAt: new Date("2025-04-14T12:00:00Z"),
        updatedAt: new Date("2025-04-14T12:00:00Z")
    });
});

afterAll(async () => {
    await sequelize.close();
});

describe('GET /api/mission/:idMission/messages', () => {
    test("Retourne une erreur si l'ID de mission est invalide", async () => {
        const response = await request(app)
            .get('/api/mission/abc/message')
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe(ErrorEnum.INVALID_ID);
    });

    test("Retourne une erreur si la mission n'existe pas", async () => {
        const response = await request(app)
            .get('/api/mission/999/message')
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(404);
        expect(response.body.error).toBe(MissionEnum.MISSION_NOT_FOUND);
    });

    test("Retourne les messages associés à la mission, triés DESC, avec auteur", async () => {
        const response = await request(app)
            .get(`/api/mission/${createdMissionId}/message`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.messages)).toBe(true);
        expect(response.body.messages.length).toBe(2);

        const [msg0, msg1] = response.body.messages;

        expect(msg0.message).toBe("Deuxième message");
        expect(msg1.message).toBe("Premier message");

        expect(msg0.author).toMatchObject({
            id: createdAccountId,
            firstName: "John",
            lastName: "Doe",
            email: "jondoe@example.com"
        });
    });
});