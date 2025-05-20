import request from 'supertest';
import sequelize from "../../config/sequelize";
import { resetDatabase } from "../../utils/databaseUtils";
import app from '../../app';
import MissionModel from '../../models/MissionModel';
import MissionTypeModel from '../../models/MissionTypeModel';
import { generateAuthTokenForTest } from "../Utils/TestProvider";
import { ErrorEnum } from "../../enums/errorEnum";
import { MissionEnum } from '../../controllers/enums/MissionEnum';
import AccountModel from '../../models/AccountModel';
import AccountMissionAssignModel from '../../models/AccountMissionAssignModel';
import MessageModel from '../../models/MessageModel';
import path from "path";

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
        estimatedEnd: "2025-02-17T10:00:00Z",
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
        archivedAt: null,
    });

    await AccountMissionAssignModel.create({
        idAccount: assignedAccount.id,
        idMission: mission.id
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
    test.skip("Mission existante avec type, images, messages et participants (via upload réel)", async () => {
        if (!process.env.FILES_UPLOAD_OUTPUT) {
            throw new Error('FILES_UPLOAD_OUTPUT doit être configuré pour ce test.');
        }

        const imagePath = path.resolve(__dirname, '..', 'upload', 'input', 'test_upload_image.png');

        const account = await AccountModel.create({
            firstName: "Jean",
            lastName: "Dupont",
            email: "jean.dupont@example.com",
            password: "securepassword",
            phoneNumber: "0600000000",
            archivedAt: null,
        });

        const requestBuilder = request(app)
            .post('/api/mission')
            .field("description", "Mission test complète")
            .field("timeBegin", "2025-03-01T08:00:00Z")
            .field("estimatedEnd", "2025-03-01T08:00:00Z")
            .field("address", "Test adresse")
            .field("city", "Test ville")
            .field("postalCode", "75000")
            .field("countryCode", "FR")
            .field("missionTypeId", missionType.id)
            .field("accountAssignIds", JSON.stringify([account.id]))
            .set("Authorization", `Bearer ${authToken}`);

        await requestBuilder.attach("pictures", imagePath);
        const response = await requestBuilder;
        expect(response.status).toBe(201);

        const missionId = response.body.missionId;
        const uploadedFileName = path.basename(response.body.uploadedFiles[0]);

        await MessageModel.create({
            idMission: missionId,
            idAccount: account.id,
            message: "Message test"
        });

        const getResponse = await request(app)
            .get(`/api/mission/${missionId}`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(getResponse.status).toBe(200);

        const mission = getResponse.body.mission;

        expect(mission).toMatchObject({
            id: missionId,
            description: "Mission test complète",
            timeBegin: "2025-03-01T08:00:00.000Z",
            address: "Test adresse",
            city: "Test ville",
            postalCode: "75000",
            countryCode: "FR",
            idMissionType: missionType.id,
            missionType: {
                shortLibel: "Test",
                longLibel: "Test Mission Type"
            }
        });

        // Participants a la mission
        expect(mission.AccountModels).toEqual([
            expect.objectContaining({
                id: account.id,
                firstName: account.firstName,
                lastName: account.lastName,
                email: account.email
            })
        ]);

        // Image
        expect(mission.pictures.length).toBeGreaterThan(0);
        expect(mission.pictures[0]).toMatchObject({
            name: expect.stringContaining(uploadedFileName),
            path: expect.stringContaining(uploadedFileName),
            alt: expect.any(String)
        });

        // Message avec auteur
        expect(mission.messages.length).toBeGreaterThan(0);
        expect(mission.messages[0]).toMatchObject({
            message: "Message test",
            author: {
                id: account.id,
                firstName: account.firstName,
                lastName: account.lastName
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