import request from 'supertest';
import sequelize from '../../config/sequelize';
import { resetDatabase } from '../../utils/databaseUtils';
import app from '../..';
import { ErrorEnum } from '../../enums/errorEnum';
import { MissionEnum } from '../../controllers/enums/MissionEnum';
import AccountModel from '../../models/AccountModel';
import MissionModel from '../../models/MissionModel';
import MessageModel from '../../models/MessageModel';
import MissionTypeModel from '../../models/MissionTypeModel';
import { generateAuthTokenForTest } from '../Utils/TestProvider';

let authToken: string;
let createdMissionId: number;
let createdAccountId: number;

beforeAll(async () => {
    await resetDatabase();

    authToken = await generateAuthTokenForTest();

    const missionType = await MissionTypeModel.create({
        id: 1,
        longLibel: "Test Mission Type",
        shortLibel: "Test"
    });

    const account = await AccountModel.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        password: 'securepassword',
    });
    createdAccountId = account.id;

    const mission = await MissionModel.create({
        description: 'Mission de test',
        timeBegin: '2025-05-01T10:00:00Z',
        address: '123 Test Street',
        idMissionType: missionType.id,
    });
    createdMissionId = mission.id;
});

afterAll(async () => {
    await sequelize.close();
});

describe('addMessageToMission', () => {
    test('Échec si des champs requis sont manquants', async () => {
        const response = await request(app)
            .post(`/api/mission/${createdMissionId}/message`)
            .send({})
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe(ErrorEnum.MISSING_REQUIRED_FIELDS);
    });

    test('Échec si la mission n\'existe pas', async () => {
        const response = await request(app)
            .post(`/api/mission/9999/message`)
            .send({
                message: "Bonjour !",
                idAccount: createdAccountId,
            })
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(404);
        expect(response.body.error).toBe(MissionEnum.MISSION_NOT_FOUND);
    });

    test('Échec si le compte n\'existe pas', async () => {
        const response = await request(app)
            .post(`/api/mission/${createdMissionId}/message`)
            .send({
                message: "Bonjour !",
                idAccount: 9999,
            })
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(404);
        expect(response.body.error).toBe(MissionEnum.USER_NOT_FOUND);
    });

    test('Succès de l\'ajout de message à une mission', async () => {
        const response = await request(app)
            .post(`/api/mission/${createdMissionId}/message`)
            .send({
                message: "Message de test",
                idAccount: createdAccountId,
            })
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(201);
        expect(response.body.message).toBe(MissionEnum.MISSION_ADD_COMMENT_SUCCESS);
        expect(typeof response.body.id).toBe("number");

        const createdMessage = await MessageModel.findByPk(response.body.id);
        expect(createdMessage).not.toBeNull();
        expect(createdMessage?.message).toBe("Message de test");
        expect(createdMessage?.idMission).toBe(createdMissionId);
        expect(createdMessage?.idAccount).toBe(createdAccountId);
    });
});