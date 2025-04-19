import request from 'supertest';
import sequelize from "../../config/sequelize";
import { resetDatabase } from "../../utils/databaseUtils";
import app from "../../index";
import MissionModel from '../../models/MissionModel';
import MissionTypeModel from '../../models/MissionTypeModel';
import { generateAuthTokenForTest } from "../Utils/TestProvider";
import { ErrorEnum } from "../../enums/errorEnum";
import { MissionEnum } from '../../controllers/enums/MissionEnum';
import AccountModel from '../../models/AccountModel';
import AccountMissionAssignModel from '../../models/AccountMissionAssignModel';
import PictureModel from '../../models/PictureModel';
import MessageModel from '../../models/MessageModel';

let authToken: string;
let missionId: number;
let missionType: MissionTypeModel;
let assignedAccount: AccountModel;

beforeAll(async () => {
    await resetDatabase();

    authToken = await generateAuthTokenForTest();

    missionType = await MissionTypeModel.create({
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

    assignedAccount = await AccountModel.create({
        firstName: "2John",
        lastName: "2Doe",
        email: "2john.doe@example.com",
        password: "hashedpassword",
        phoneNumber: "0600000000",
        isEnabled: true
    });

    await AccountMissionAssignModel.create({
        idAccount: assignedAccount.id,
        idMission: mission.id
    });

    await PictureModel.create({
        idMission: mission.id,
        name: "test-image.png",
        alt: "Test image",
        path: "uploads/test-image.png"
    });

    await MessageModel.create({
        idMission: mission.id,
        idAccount: assignedAccount.id,
        message: "Hello this is a test comment"
    });
});

afterAll(async () => {
    await sequelize.close();
});

describe("getDetailMissionById", () => {
    test("Mission existante avec type, images, messages et participants", async () => {
        const response = await request(app)
            .get(`/api/mission/${missionId}`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);

        const mission = response.body.mission;

        expect(mission).toMatchObject({
            id: missionId,
            description: "Test mission description",
            timeBegin: "2025-02-17T10:00:00.000Z",
            address: "Test address",
            idMissionType: missionType.id,
            missionType: {
                shortLibel: "Test",
                longLibel: "Test Mission Type"
            }
        });

        // Participants
        expect(mission.AccountModels).toEqual([
            expect.objectContaining({
                id: assignedAccount.id,
                firstName: assignedAccount.firstName,
                lastName: assignedAccount.lastName,
                email: assignedAccount.email,
            })
        ]);

        expect(mission.pictures).toEqual([
            expect.objectContaining({
                name: "test-image.png",
                alt: "Test image",
                path: "uploads/test-image.png"
            })
        ]);

        expect(mission.messages.length).toBeGreaterThan(0);
        expect(mission.messages[0]).toMatchObject({
            message: "Hello this is a test comment",
            author: {
                id: assignedAccount.id,
                firstName: assignedAccount.firstName,
                lastName: assignedAccount.lastName
            }
        });
    });

    test("Mission inexistante", async () => {
        const response = await request(app)
            .get(`/api/mission/99999`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe(MissionEnum.MISSION_NOT_FOUND);
    });

    test("ID invalide (non numérique)", async () => {
        const response = await request(app)
            .get(`/api/mission/abc`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(ErrorEnum.INVALID_ID);
    });

    test("Erreur serveur simulée", async () => {
        const spy = jest.spyOn(MissionModel, 'findByPk').mockRejectedValue(new Error("Erreur interne"));

        const response = await request(app)
            .get(`/api/mission/${missionId}`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(500);
        expect(response.body.message).toBe(MissionEnum.ERROR_DURING_FETCHING_MISSION);

        spy.mockRestore();
    });
});