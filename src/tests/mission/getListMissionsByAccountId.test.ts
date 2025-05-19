import request from 'supertest';
import sequelize from '../../config/sequelize';
import { resetDatabase } from '../../utils/databaseUtils';
import app from '../../app';
import { ErrorEnum } from '../../enums/errorEnum';
import MissionModel from '../../models/MissionModel';
import AccountModel from '../../models/AccountModel';
import AccountMissionAssignModel from '../../models/AccountMissionAssignModel';
import MissionTypeModel from '../../models/MissionTypeModel';
import { MissionEnum } from '../../controllers/enums/MissionEnum';
import { generateAuthTokenForTest } from '../Utils/TestProvider';

let authToken: string;
let accountId: number;

beforeAll(async () => {
    await resetDatabase();

    authToken = await generateAuthTokenForTest();

    const account = await AccountModel.create({
        firstName: "Test",
        lastName: "User",
        email: "test.user@example.com",
        password: "securepassword",
        isAdmin: false,
    });

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
            estimatedEnd: new Date("2025-03-26T10:00:00Z"),
            address: "Adresse A",
            idMissionType: 1
        },
        {
            description: "Mission B",
            timeBegin: new Date("2025-03-28T10:00:00Z"),
            estimatedEnd: new Date("2025-03-26T10:00:00Z"),
            address: "Adresse B",
            idMissionType: 1
        },
        {
            description: "Mission C",
            timeBegin: new Date("2025-04-02T10:00:00Z"),
            estimatedEnd: new Date("2025-03-26T10:00:00Z"),
            address: "Adresse C",
            idMissionType: 1
        }
    ]);

    const missions = await MissionModel.findAll();
    for (const mission of missions) {
        await AccountMissionAssignModel.create({
            idAccount: accountId,
            idMission: mission.id
        });
    }
});

afterAll(async () => {
    await sequelize.close();
});

describe('Liste des missions filtrées', () => {
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

    test('Retourne toutes les missions liées au compte', async () => {
        const otherAccount = await AccountModel.create({
            firstName: "Other",
            lastName: "User",
            email: "other.user@example.com",
            password: "securepassword"
        });

        const unlinkedMission = await MissionModel.create({
            description: "Mission isolée",
            timeBegin: new Date("2025-03-29T10:00:00Z"),
            address: "Adresse X",
            idMissionType: 1,
            estimatedEnd: new Date("2025-03-29T10:00:00Z"),
            accountAssignId: otherAccount.id
        });

        const response = await request(app)
            .get(`/api/mission/listMissions/${accountId}`)
            .set("Authorization", `Bearer ${authToken}`);

        const missions = response.body;

        expect(response.status).toBe(200);
        expect(missions.length).toBe(3);
    });

    test('Chaque mission contient les comptes participants', async () => {
        const response = await request(app)
            .get(`/api/mission/listMissions/${accountId}`)
            .set("Authorization", `Bearer ${authToken}`);

        const missions = response.body;

        expect(response.status).toBe(200);
        expect(missions.length).toBeGreaterThan(0);

        for (const mission of missions) {
            expect(mission.AccountModels).toBeDefined();
            expect(Array.isArray(mission.AccountModels)).toBe(true);
            expect(mission.AccountModels.length).toBeGreaterThan(0);

            const participant = mission.AccountModels[0];
            expect(participant).toHaveProperty('id');
            expect(participant).toHaveProperty('firstName');
            expect(participant).toHaveProperty('lastName');
        }
    });

    test('Filtre avec la date de début "from"', async () => {
        const response = await request(app)
            .get(`/api/mission/listMissions/${accountId}?from=2025-03-27`)
            .set("Authorization", `Bearer ${authToken}`);

        const missions = response.body;

        expect(response.status).toBe(200);
        expect(missions.length).toBe(2);
        expect(missions.map(m => m.description)).not.toContain("Mission A");
    });

    test('Filtre avec la date de fin "to"', async () => {
        const response = await request(app)
            .get(`/api/mission/listMissions/${accountId}?to=2025-03-30`)
            .set("Authorization", `Bearer ${authToken}`);

        const missions = response.body;

        expect(response.status).toBe(200);
        expect(missions.length).toBe(2);
        expect(missions.map(m => m.description)).not.toContain("Mission C");
    });

    test('Filtre entre deux dates', async () => {
        const response = await request(app)
            .get(`/api/mission/listMissions/${accountId}?from=2025-03-27&to=2025-03-30`)
            .set("Authorization", `Bearer ${authToken}`);

        const missions = response.body;

        expect(response.status).toBe(200);
        expect(missions.length).toBe(1);
        expect(missions[0].description).toBe("Mission B");
    });

    test('Filtre par type de mission', async () => {
        const response = await request(app)
            .get(`/api/mission/listMissions/${accountId}?filterByType=1`)
            .set("Authorization", `Bearer ${authToken}`);

        const missions = response.body;

        expect(response.status).toBe(200);
        expect(missions.length).toBe(3);
    });

    test('Filtre par un nombre limité de missions', async () => {
        const response = await request(app)
            .get(`/api/mission/listMissions/${accountId}?limit=2`)
            .set("Authorization", `Bearer ${authToken}`);

        const missions = response.body;

        expect(response.status).toBe(200);
        expect(missions.length).toBeLessThanOrEqual(2);

        // Vérifie l'ordre décroissant des dates
        const dates = missions.map(m => new Date(m.timeBegin).getTime());
        expect(dates).toEqual([...dates].sort((a, b) => b - a));
    });

    test('Filtre combiné type + dates', async () => {
        const response = await request(app)
            .get(`/api/mission/listMissions/${accountId}?filterByType=1&from=2025-03-27&to=2025-04-01`)
            .set("Authorization", `Bearer ${authToken}`);

        const missions = response.body;

        expect(response.status).toBe(200);
        expect(missions.length).toBe(1);
        expect(missions[0].description).toBe("Mission B");
    });

    test('Retourne missions filtrées par date et limitées en nombre', async () => {
        const response = await request(app)
            .get(`/api/mission/listMissions/${accountId}?from=2025-03-26&limit=1`)
            .set("Authorization", `Bearer ${authToken}`);

        const missions = response.body;

        expect(response.status).toBe(200);
        expect(missions.length).toBe(1);
    });

    test('Combine limit, type et date pour retourner les missions correspondantes', async () => {
        const response = await request(app)
            .get(`/api/mission/listMissions/${accountId}?filterByType=1&from=2025-03-01&to=2025-04-30&limit=1`)
            .set("Authorization", `Bearer ${authToken}`);

        const missions = response.body;

        expect(response.status).toBe(200);
        expect(missions.length).toBe(1);
    });

    test('Retourne 200 avec une liste vide si aucun résultat', async () => {
        const response = await request(app)
            .get(`/api/mission/listMissions/${accountId}?from=2030-01-01`)
            .set("Authorization", `Bearer ${authToken}`);

        const missions = response.body;

        expect(response.status).toBe(200);
        expect(missions).toEqual([]);
    });

    test('Filtre par statut: actives', async () => {
        await AccountMissionAssignModel.destroy({ where: {} });
        await MissionModel.destroy({ where: {} });

        const now = new Date();
        const mission = await MissionModel.create({
            description: "Mission active",
            timeBegin: new Date(now.getTime() - 60 * 60 * 1000), // 1h avant
            timeEnd: new Date(now.getTime() + 60 * 60 * 1000),   // 1h après
            estimatedEnd: new Date(now.getTime()  + 60 * 60 * 1000),
            address: "Adresse active",
            idMissionType: 1
        });

        await AccountMissionAssignModel.create({ idAccount: accountId, idMission: mission.id });

        const response = await request(app)
            .get(`/api/mission/listMissions/${accountId}?status=actives`)
            .set("Authorization", `Bearer ${authToken}`);

        const missions = response.body;

        expect(response.status).toBe(200);
        expect(missions.length).toBe(1);
        expect(missions[0].description).toBe("Mission active");
    });


    test('Filtre par statut: prévues', async () => {
        await AccountMissionAssignModel.destroy({ where: {} });
        await MissionModel.destroy({ where: {} });

        const mission = await MissionModel.create({
            description: "Mission prévue",
            timeBegin: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            estimatedEnd: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
            address: "Adresse prévue",
            idMissionType: 1
        });

        await AccountMissionAssignModel.create({ idAccount: accountId, idMission: mission.id });

        const response = await request(app)
            .get(`/api/mission/listMissions/${accountId}?status=prevues`)
            .set("Authorization", `Bearer ${authToken}`);

        const missions = response.body;

        expect(response.status).toBe(200);
        expect(missions.length).toBe(1);
        expect(missions[0].description).toBe("Mission prévue");
    });

    test('Filtre par statut: passées', async () => {
        await AccountMissionAssignModel.destroy({ where: {} });
        await MissionModel.destroy({ where: {} });

        const mission = await MissionModel.create({
            description: "Mission passée",
            timeBegin: new Date("2025-01-01T09:00:00Z"),
            timeEnd: new Date("2025-01-02T10:00:00Z"),
            estimatedEnd: "2025-01-02T10:00:00Z",
            address: "Adresse passée",
            idMissionType: 1
        });

        await AccountMissionAssignModel.create({ idAccount: accountId, idMission: mission.id });

        const response = await request(app)
            .get(`/api/mission/listMissions/${accountId}?status=passees`)
            .set("Authorization", `Bearer ${authToken}`);

        const missions = response.body;

        expect(response.status).toBe(200);
        expect(missions.length).toBe(1);
        expect(missions[0].description).toBe("Mission passée");
    });

    test('Filtre par statut: annulées', async () => {
        await AccountMissionAssignModel.destroy({ where: {} });
        await MissionModel.destroy({ where: {} });

        const now = new Date();
        const mission = await MissionModel.create({
            description: "Mission annulée",
            timeBegin: new Date(now.getTime() + 2 * 60 * 60 * 1000),
            timeEnd: new Date(now.getTime() + 3 * 60 * 60 * 1000),
            estimatedEnd: new Date(Date.now() + 3 * 60 * 60 * 1000),
            address: "Adresse annulée",
            isCanceled: true,
            idMissionType: 1
        });

        await AccountMissionAssignModel.create({ idAccount: accountId, idMission: mission.id });

        const response = await request(app)
            .get(`/api/mission/listMissions/${accountId}?status=annulees`)
            .set("Authorization", `Bearer ${authToken}`);

        const missions = response.body;

        expect(response.status).toBe(200);
        expect(missions.length).toBe(1);
        expect(missions[0].description).toBe("Mission annulée");
    });
});
