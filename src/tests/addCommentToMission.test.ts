import request from 'supertest';
import sequelize from "../config/sequelize";
import { resetDatabase } from "../utils/databaseUtils";
import app from "..";
import { ErrorEnum } from '../enums/errorEnum';
import MissionTypeModel from '../models/MissionTypeModel';
import { MissionEnum } from '../controllers/enums/MissionEnum';
import AccountModel from '../models/AccountModel';
import MessageModel from '../models/MessageModel';
import MissionModel from '../models/MissionModel';
import { generateAuthTokenForTest } from './Utils/TestProvider';

let authToken: string;
let testAccount: AccountModel;
let testMission: MissionModel;

beforeAll(async () => {
    await resetDatabase();

    authToken = await generateAuthTokenForTest();

    await MissionTypeModel.create({
        id: 1,
        longLibel: "Test Mission Type",
        shortLibel: "Test"
    });

    testAccount = await AccountModel.create({
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: "password123",
        address: "123 Test Street",
        notificationMail: true,
        notificationSms: false,
        isEnabled: true,
    });

    testMission = await MissionModel.create({
        description: "Test mission",
        timeBegin: new Date(),
        address: "Test address",
        idMissionType: 1
    });
});

afterAll(async () => {
    await sequelize.close();
});

beforeEach(async () => {
    await MessageModel.destroy({ where: {} });
});

describe("Ajout de commentaires à une mission", () => {

    test("Ajout réussi d'un commentaire", async () => {
        const response = await request(app)
            .post('/api/mission/1/comment')
            .send({
                message: "Super mission !",
                idAccount: testAccount.id,
                idMission: testMission.id
            })
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(201);
        expect(response.body.message).toBe(MissionEnum.COMMENT_SUCCESSFULLY_ADDED);
        expect(response.body.comment).toMatchObject({
            message: "Super mission !",
            idAccount: testAccount.id,
            idMission: testMission.id
        });

        //Vérification que le commentaire a bien été ajouté dans la base de données
        const comment = await MessageModel.findOne({ where: { idMission: testMission.id } });
        expect(comment).not.toBeNull();
        expect(comment!.message).toBe("Super mission !");
    });

    test("Échec lors de l'ajout d'un commentaire avec un compte inexistant", async () => {
        const response = await request(app)
            .post('/api/mission/1/comment')
            .send({
                message: "Super mission !",
                idAccount: 9999,
                idMission: testMission.id
            })
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe(MissionEnum.USER_NOT_FOUND);
    });

    test("Échec lors de l'ajout d'un commentaire avec une mission inexistante", async () => {
        const response = await request(app)
            .post('/api/mission/1/comment')
            .send({
                message: "Super mission !",
                idAccount: testAccount.id,
                idMission: 9999
            })
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe(MissionEnum.MISSION_NOT_FOUND);
    });

    test("Échec lors de l'ajout d'un commentaire avec des champs manquants", async () => {
        const response = await request(app)
            .post('/api/mission/1/comment')
            .send({
                message: "",
                idAccount: testAccount.id,
                idMission: testMission.id
            })
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(ErrorEnum.MISSING_REQUIRED_FIELDS);
    });

    test("Récupération de mission avec les commentaires associés", async () => {
        // ✅ Ajout d'un commentaire préalable
        await MessageModel.create({
            message: "Super mission !",
            idAccount: testAccount.id,
            idMission: testMission.id
        });

        const response = await request(app)
            .get(`/api/mission/${testMission.id}`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.mission).toMatchObject({
            id: testMission.id,
            description: "Test mission",
            address: "Test address"
        });

        expect(response.body.mission.missionMessages).toHaveLength(1);
        expect(response.body.mission.missionMessages[0]).toMatchObject({
            message: "Super mission !",
            idAccount: testAccount.id
        });
    });
});