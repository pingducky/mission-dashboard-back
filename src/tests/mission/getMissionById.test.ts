import request from 'supertest';
import sequelize from "../../config/sequelize";
import { resetDatabase } from "../../utils/databaseUtils";
import app from "../../index";
import MissionModel from '../../models/MissionModel';
import PictureModel from '../../models/PictureModel';
import { MissionEnum } from '../../controllers/enums/MissionEnum';
import MissionTypeModel from '../../models/MissionTypeModel';
import {generateAuthTokenForTest} from "../Utils/TestProvider";
import {ErrorEnum} from "../../enums/errorEnum";

let authToken: string;
let missionId: number;

beforeAll(async () => {
    await resetDatabase();

    authToken = await generateAuthTokenForTest();

    const missionType = await MissionTypeModel.create({
        id: 1,
        longLibel: "Test Mission Type",
        shortLibel: "Test"
    });

    const mission = await MissionModel.create({
        description: "Test mission description",
        timeBegin: "2025-02-17T10:00:00Z",
        address: "Test address",
        idMissionType: missionType.id,
    });

    missionId = mission.id;

    await PictureModel.create({
        name: "test_image.png",
        alt: "test_image.png",
        path: "/uploads/test_image.png",
        idMission: mission.id
    });
});

afterAll(async () => {
    await sequelize.close();
});

describe("Récupération d'une mission par ID", () => {
    test("Test avec un ID valide et mission existante", async () => {
        const response = await request(app)
            .get(`/api/mission/${missionId}`)
            .set("Authorization", `Bearer ${authToken}`)

        expect(response.status).toBe(200);
        expect(response.body.mission).toMatchObject({
            id: missionId,
            description: "Test mission description",
            timeBegin: "2025-02-17T10:00:00.000Z",
            address: "Test address",
            idMissionType: 1
        });

        expect(response.body.mission.pictures).toEqual([
            {
                id: expect.any(Number),
                name: "test_image.png",
                alt: "test_image.png",
                path: "/uploads/test_image.png"
            }
        ]);
    });

    test("Test avec un ID valide mais mission inexistante", async () => {
        const invalidMissionId = 99999;

        const response = await request(app)
            .get(`/api/mission/${invalidMissionId}`)
            .set("Authorization", `Bearer ${authToken}`)

        expect(response.status).toBe(404);
        expect(response.body.message).toBe(MissionEnum.MISSION_NOT_FOUND);
    });

    test("Test avec un ID invalide (non numérique)", async () => {
        const invalidMissionId = "abc";

        const response = await request(app)
            .get(`/api/mission/${invalidMissionId}`)
            .set("Authorization", `Bearer ${authToken}`)

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(ErrorEnum.ID_INVALID);
    });

    test("Test avec une mission existante mais sans photos associées", async () => {
        const newMission = await MissionModel.create({
            description: "Test mission sans photo",
            timeBegin: "2025-02-17T10:00:00Z",
            address: "Test address",
            idMissionType: 1,
        });

        const response = await request(app)
            .get(`/api/mission/${newMission.id}`)
            .set("Authorization", `Bearer ${authToken}`)

        expect(response.status).toBe(200);
        expect(response.body.mission).toMatchObject({
            id: newMission.id,
            description: "Test mission sans photo",
            timeBegin: "2025-02-17T10:00:00.000Z",
            address: "Test address",
            idMissionType: 1
        });

        expect(response.body.mission.pictures).toEqual([]);
    });

    test("Test avec une erreur inattendue (exemple : problème de base de données)", async () => {
        const spy = jest.spyOn(MissionModel, 'findByPk').mockRejectedValue(new Error("Problème interne"));

        const response = await request(app)
            .get(`/api/mission/${missionId}`)
            .set("Authorization", `Bearer ${authToken}`)

        expect(response.status).toBe(500);
        expect(response.body.message).toBe(MissionEnum.ERROR_DURING_FETCHING_MISSION);

        spy.mockRestore();
    });
});