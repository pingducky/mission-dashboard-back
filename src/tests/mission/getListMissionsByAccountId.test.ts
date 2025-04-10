import request from 'supertest';
import app from '../..';
import sequelize from '../../config/sequelize';
import { resetDatabase } from '../../utils/databaseUtils';
import MissionModel from '../../models/MissionModel';
import MissionTypeModel from '../../models/MissionTypeModel';
import AccountModel from '../../models/AccountModel';
import AccountMissionAssignModel from '../../models/AccountMissionAssignModel';
import { generateAuthTokenForTest } from '../Utils/TestProvider';

let authToken: string;
let testAccountId: number;

beforeAll(async () => {
    await resetDatabase();

    authToken = await generateAuthTokenForTest();

    // Création d'un compte
    const account = await AccountModel.create({
        firstName: "lulJoe",
        lastName: "lulDoe",
        password: "password",
        phoneNumber: "0600000000",
        email: "LuLjohn.doe@example.com",
        address: "1 rue de test"
    });
    testAccountId = account.id;

    // Création d’un type de mission
    await MissionTypeModel.create({
        id: 1,
        longLibel: "Test Mission Type",
        shortLibel: "Test"
    });

    // Création de missions liées
    const mission1 = await MissionModel.create({
        description: "Mission 1",
        timeBegin: new Date("2025-04-01T10:00:00Z"),
        address: "Paris",
        idMissionType: 1
    });

    const mission2 = await MissionModel.create({
        description: "Mission 2",
        timeBegin: new Date("2025-04-05T14:00:00Z"),
        address: "Lyon",
        idMissionType: 1
    });

    await AccountMissionAssignModel.bulkCreate([
        { idAccount: testAccountId, idMission: mission1.id },
        { idAccount: testAccountId, idMission: mission2.id }
    ]);
});

afterAll(async () => {
    await sequelize.close();
});

describe('GET /api/mission/by-account/:id', () => {
    test('Retourne toutes les missions du compte sans filtre', async () => {
        const res = await request(app)
            .get(`/api/mission/by-account/${testAccountId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.missions.length).toBe(2);
        expect(res.body.missions[0]).toHaveProperty('description');
    });

    test('Filtre les missions avec `from`', async () => {
        const res = await request(app)
            .get(`/api/mission/by-account/${testAccountId}?from=2025-04-03`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.missions.length).toBe(1);
        expect(res.body.missions[0].description).toBe("Mission 2");
    });

    test('Filtre avec `from` + `to`', async () => {
        const res = await request(app)
            .get(`/api/mission/by-account/${testAccountId}?from=2025-04-01&to=2025-04-03`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.missions.length).toBe(1);
        expect(res.body.missions[0].description).toBe("Mission 1");
    });

    test('Filtre avec `filterByType`', async () => {
        const res = await request(app)
            .get(`/api/mission/by-account/${testAccountId}?filterByType=1`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.missions.length).toBe(2);
    });

    test('Renvoie 400 si l\'ID n\'est pas un nombre', async () => {
        const res = await request(app)
            .get('/api/mission/by-account/abc')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('ID invalide');
    });

    test('Renvoie 404 si le compte n\'existe pas', async () => {
        const res = await request(app)
            .get('/api/mission/by-account/9999')
            .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Compte non trouvé');
    });
});