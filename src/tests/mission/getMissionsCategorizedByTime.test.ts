import request from 'supertest';
import sequelize from "../../config/sequelize";
import { resetDatabase } from "../../utils/databaseUtils";
import app from "../..";
import { ErrorEnum } from '../../enums/errorEnum';
import { MissionEnum } from '../../controllers/enums/MissionEnum';
import MissionTypeModel from '../../models/MissionTypeModel';
import MissionModel from '../../models/MissionModel';
import PictureModel from '../../models/PictureModel';
import AccountModel from '../../models/AccountModel';
import AccountMissionAssignModel from '../../models/AccountMissionAssignModel';
import { generateAuthTokenForTest } from '../Utils/TestProvider';

let authToken: string;
let createdAccountId: number;

beforeEach(async () => {
    await AccountMissionAssignModel.destroy({ where: {}, force: true });
    await PictureModel.destroy({ where: {}, force: true });
    await MissionModel.destroy({ where: {}, force: true });
});

beforeAll(async () => {
    await resetDatabase();

    authToken = await generateAuthTokenForTest();

    await MissionTypeModel.create({
        id: 1,
        longLibel: "Test Type",
        shortLibel: "TT"
    });

    const account = await AccountModel.create({
        firstName: "Test",
        lastName: "User",
        email: "test.user@example.com",
        password: "securepassword"
    });

    createdAccountId = account.id;
});

afterAll(async () => {
    await sequelize.close();
});

describe('GET /api/missions/:id', () => {

    const today = new Date();
    const currentDate = new Date(today);
    const pastDate = new Date(today);
    const futureDate = new Date(today);

    [pastDate, currentDate, futureDate].forEach(date => date.setHours(10, 0, 0, 0));

    pastDate.setDate(today.getDate() - 1);
    futureDate.setDate(today.getDate() + 1);

    beforeEach(async () => {
        const missions = await MissionModel.bulkCreate([
            {
                description: "Mission passée",
                timeBegin: pastDate,
                timeEnd: pastDate,
                address: "Rue du passé",
                idMissionType: 1
            },
            {
                description: "Mission passée2",
                timeBegin: pastDate,
                timeEnd: pastDate,
                address: "Rue du passé2",
                idMissionType: 1
            },
            {
                description: "Mission en cours",
                timeBegin: currentDate,
                address: "Rue du présent",
                idMissionType: 1
            },
            {
                description: "Mission en cours2",
                timeBegin: currentDate,
                address: "Rue du présent2",
                idMissionType: 1
            },
            {
                description: "Mission future",
                timeBegin: futureDate,
                address: "Rue du futur",
                idMissionType: 1
            },
            {
                description: "Mission future2",
                timeBegin: futureDate,
                address: "Rue du futur2",
                idMissionType: 1
            }
        ], { returning: true });

        for (const mission of missions) {
            await AccountMissionAssignModel.create({
                idAccount: createdAccountId,
                idMission: mission.id
            });
        }
    });

    test('Renvoie une erreur si ID invalide', async () => {
        const response = await request(app)
            .get('/api/mission/MissionCategorized/abc')
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe(ErrorEnum.INVALID_ID);
    });

    test('Renvoie une erreur si l’utilisateur n’existe pas', async () => {
        const response = await request(app)
            .get('/api/mission/MissionCategorized/9999')
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(404);
        expect(response.body.error).toBe(MissionEnum.USER_NOT_FOUND);
    });

    test('Renvoie 401 si non authentifié', async () => {
        const response = await request(app)
            .get(`/api/mission/MissionCategorized/${createdAccountId}`);

        expect(response.status).toBe(401);
    });

    test('Renvoie toutes les catégories si aucun filtre', async () => {
        const response = await request(app)
            .get(`/api/mission/MissionCategorized/${createdAccountId}`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.past.length).toBe(2);
        expect(response.body.current.length).toBe(2);
        expect(response.body.future.length).toBe(2);
    });

    test('Renvoie uniquement les missions passées', async () => {
        const response = await request(app)
            .get(`/api/mission/MissionCategorized/${createdAccountId}?filter=past`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.past.length).toBe(2);
        expect(response.body.current.length).toBe(0);
        expect(response.body.future.length).toBe(0);
    });

    test('Renvoie uniquement les missions en cours', async () => {
        const response = await request(app)
            .get(`/api/mission/MissionCategorized/${createdAccountId}?filter=current`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.past.length).toBe(0);
        expect(response.body.current.length).toBe(2);
        expect(response.body.future.length).toBe(0);
    });

    test('Renvoie uniquement les missions futures', async () => {
        const response = await request(app)
            .get(`/api/mission/MissionCategorized/${createdAccountId}?filter=future`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.past.length).toBe(0);
        expect(response.body.current.length).toBe(0);
        expect(response.body.future.length).toBe(2);
    });

    test('Renvoie les missions combinées (past + current)', async () => {
        const response = await request(app)
            .get(`/api/mission/MissionCategorized/${createdAccountId}?filter=past&filter=current`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.past.length).toBe(2);
        expect(response.body.current.length).toBe(2);
        expect(response.body.future.length).toBe(0);
    });

    test('Renvoie les missions combinées (past + future)', async () => {
        const response = await request(app)
            .get(`/api/mission/MissionCategorized/${createdAccountId}?filter=past&filter=future`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.past.length).toBe(2);
        expect(response.body.current.length).toBe(0);
        expect(response.body.future.length).toBe(2);
    });

    test('Renvoie les missions combinées (current + past)', async () => {
        const response = await request(app)
            .get(`/api/mission/MissionCategorized/${createdAccountId}?filter=current&filter=past`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.past.length).toBe(2);
        expect(response.body.current.length).toBe(2);
        expect(response.body.future.length).toBe(0);
    });

    test('Renvoie les missions combinées (current + future)', async () => {
        const response = await request(app)
            .get(`/api/mission/MissionCategorized/${createdAccountId}?filter=current&filter=future`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.past.length).toBe(0);
        expect(response.body.current.length).toBe(2);
        expect(response.body.future.length).toBe(2);
    });

    test('Renvoie les missions combinées (future + past)', async () => {
        const response = await request(app)
            .get(`/api/mission/MissionCategorized/${createdAccountId}?filter=future&filter=past`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.past.length).toBe(2);
        expect(response.body.current.length).toBe(0);
        expect(response.body.future.length).toBe(2);
    });

    test('Renvoie les missions combinées (future + current)', async () => {
        const response = await request(app)
            .get(`/api/mission/MissionCategorized/${createdAccountId}?filter=future&filter=current`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.past.length).toBe(0);
        expect(response.body.current.length).toBe(2);
        expect(response.body.future.length).toBe(2);
    });

    test('Renvoie avec limitation de résultat par catégorie', async () => {
        const response = await request(app)
            .get(`/api/mission/MissionCategorized/${createdAccountId}?filter=past&limit=1`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.past.length).toBe(1);
        expect(response.body.current.length).toBe(0);
        expect(response.body.future.length).toBe(0);
    });

    test('Ignore les filtres inconnus et ne renvoie rien', async () => {
        const response = await request(app)
            .get(`/api/mission/MissionCategorized/${createdAccountId}?filter=invalid`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.past.length).toBe(0);
        expect(response.body.current.length).toBe(0);
        expect(response.body.future.length).toBe(0);
    });

    test('Ignore les filtres inconnus mais garde les valides', async () => {
        const response = await request(app)
            .get(`/api/mission/MissionCategorized/${createdAccountId}?filter=invalid&filter=future`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.past.length).toBe(0);
        expect(response.body.current.length).toBe(0);
        expect(response.body.future.length).toBe(2);
    });

    test('Applique le limit sur plusieurs filtres combinés', async () => {
        const response = await request(app)
            .get(`/api/mission/MissionCategorized/${createdAccountId}?filter=past&filter=future&limit=1`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.past.length).toBe(1);
        expect(response.body.current.length).toBe(0);
        expect(response.body.future.length).toBe(1);
    });
});