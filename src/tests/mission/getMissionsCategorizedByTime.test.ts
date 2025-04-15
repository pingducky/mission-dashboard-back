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

    const pastDate = "2025-04-14T10:00:00Z";
    const currentDate = "2025-04-15T10:00:00Z";
    const futureDate = "2025-04-16T10:00:00Z";

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
                description: "Mission en cours",
                timeBegin: currentDate,
                address: "Rue du présent",
                idMissionType: 1
            },
            {
                description: "Mission future",
                timeBegin: futureDate,
                address: "Rue du futur",
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
            .get('/api/missions/9999')
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(404);
        expect(response.body.error).toBe(MissionEnum.USER_NOT_FOUND);
    });

    test('Renvoie toutes les catégories si aucun filtre', async () => {
        const response = await request(app)
            .get(`/api/missions/${createdAccountId}`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.past.length).toBe(1);
        expect(response.body.current.length).toBe(1);
        expect(response.body.future.length).toBe(1);
    });

    test('Renvoie uniquement les missions passées', async () => {
        const response = await request(app)
            .get(`/api/missions/${createdAccountId}?filter=past`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.past.length).toBe(1);
        expect(response.body.current.length).toBe(0);
        expect(response.body.future.length).toBe(0);
    });

    test('Renvoie uniquement les missions futures', async () => {
        const response = await request(app)
            .get(`/api/missions/${createdAccountId}?filter=future`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.past.length).toBe(0);
        expect(response.body.current.length).toBe(0);
        expect(response.body.future.length).toBe(1);
    });

    test('Renvoie uniquement les missions en cours', async () => {
        const response = await request(app)
            .get(`/api/missions/${createdAccountId}?filter=current`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.past.length).toBe(0);
        expect(response.body.current.length).toBe(1);
        expect(response.body.future.length).toBe(0);
    });

    test('Renvoie les missions combinées (past + future)', async () => {
        const response = await request(app)
            .get(`/api/missions/${createdAccountId}?filter=past&filter=future`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.past.length).toBe(1);
        expect(response.body.future.length).toBe(1);
        expect(response.body.current.length).toBe(0);
    });

    test('Renvoie avec limitation de résultat par catégorie', async () => {
        const response = await request(app)
            .get(`/api/missions/${createdAccountId}?filter=past&limit=1`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.past.length).toBeLessThanOrEqual(1);
    });
});