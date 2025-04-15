import request from 'supertest';
import sequelize from '../../config/sequelize';
import { resetDatabase } from '../../utils/databaseUtils';
import app from '../..';
import { ErrorEnum } from '../../enums/errorEnum';
import MissionModel from '../../models/MissionModel';
import AccountModel from '../../models/AccountModel';
import AccountMissionAssignModel from '../../models/AccountMissionAssignModel';
import MissionTypeModel from '../../models/MissionTypeModel';
import { MissionEnum } from '../../controllers/enums/MissionEnum';
import { generateAuthTokenForTest } from '../Utils/TestProvider';

let authToken: string;
let accountId: number;

type MissionResponse = {
    description: string;
    timeBegin: string;
    address: string;
    idMissionType: number;
};

beforeAll(async () => {
    await resetDatabase();

    authToken = await generateAuthTokenForTest();

    const account = await AccountModel.create({});
    accountId = account.id;

    await MissionTypeModel.create({
        id: 1,
        shortLibel: "Test",
        longLibel: "Test Mission Type"
    });

    await MissionModel.bulkCreate([
        {
            description: "Mission A",
            timeBegin: new Date("2025-03-26T10:00:00Z"),
            address: "Adresse A",
            idMissionType: 1
        },
        {
            description: "Mission B",
            timeBegin: new Date("2025-03-28T10:00:00Z"),
            address: "Adresse B",
            idMissionType: 1
        },
        {
            description: "Mission C",
            timeBegin: new Date("2025-04-02T10:00:00Z"),
            address: "Adresse C",
            idMissionType: 1
        }
    ]);

    const missions = await MissionModel.findAll();
    for (const mission of missions) {
        await AccountMissionAssignModel.create({
            accountId: accountId,
            missionId: mission.id
        });
    }
});

afterAll(async () => {
    await sequelize.close();
});

describe('GET /api/mission/:id - Liste des missions filtrées', () => {
    test('Retourne toutes les missions liées au compte', async () => {
        const response = await request(app)
            .get(`/api/mission/listMissions/${accountId}`)
            .set("Authorization", `Bearer ${authToken}`);

        const missions = response.body.missions as MissionResponse[];

        expect(response.status).toBe(200);
        expect(missions.length).toBe(3);
    });

    test('Filtre avec la date de début "from"', async () => {
        const response = await request(app)
            .get(`/api/mission/listMissions/${accountId}?from=2025-03-27`)
            .set("Authorization", `Bearer ${authToken}`);

        const missions = response.body.missions as MissionResponse[];

        expect(response.status).toBe(200);
        expect(missions.length).toBe(2);
        expect(missions.map(m => m.description)).not.toContain("Mission A");
    });

    test('Filtre avec la date de fin "to"', async () => {
        const response = await request(app)
            .get(`/api/mission/listMissions/${accountId}?to=2025-03-30`)
            .set("Authorization", `Bearer ${authToken}`);

        const missions = response.body.missions as MissionResponse[];

        expect(response.status).toBe(200);
        expect(missions.length).toBe(2);
        expect(missions.map(m => m.description)).not.toContain("Mission C");
    });

    test('Filtre entre deux dates', async () => {
        const response = await request(app)
            .get(`/api/mission/listMissions/${accountId}?from=2025-03-27&to=2025-03-30`)
            .set("Authorization", `Bearer ${authToken}`);

        const missions = response.body.missions as MissionResponse[];

        expect(response.status).toBe(200);
        expect(missions.length).toBe(1);
        expect(missions[0].description).toBe("Mission B");
    });

    test('Filtre par type de mission', async () => {
        const response = await request(app)
            .get(`/api/mission/listMissions/${accountId}?filterByType=1`)
            .set("Authorization", `Bearer ${authToken}`);

        const missions = response.body.missions as MissionResponse[];

        expect(response.status).toBe(200);
        expect(missions.length).toBe(3);
    });

    test('Filtre combiné type + dates', async () => {
        const response = await request(app)
            .get(`/api/mission/listMissions/${accountId}?filterByType=1&from=2025-03-27&to=2025-04-01`)
            .set("Authorization", `Bearer ${authToken}`);

        const missions = response.body.missions as MissionResponse[];

        expect(response.status).toBe(200);
        expect(missions.length).toBe(1);
        expect(missions[0].description).toBe("Mission B");
    });

    test('ID de compte invalide', async () => {
        const response = await request(app)
            .get(`/api/mission/listMissions/invalid`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe(ErrorEnum.INVALID_ID);
    });

    test('Compte inexistant', async () => {
        const response = await request(app)
            .get(`/api/mission/listMissions/999999`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(404);
        expect(response.body.error).toBe(MissionEnum.USER_NOT_FOUND);
    });

    test('Retourne 200 avec une liste vide si aucun résultat', async () => {
        const response = await request(app)
            .get(`/api/missio/listMissions/${accountId}?from=2030-01-01`)
            .set("Authorization", `Bearer ${authToken}`);

        const missions = response.body.missions as MissionResponse[];

        expect(response.status).toBe(200);
        expect(missions).toEqual([]);
    });
});