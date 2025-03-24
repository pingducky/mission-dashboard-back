import request from 'supertest';
import sequelize from "../config/sequelize";
import { resetDatabase } from "../utils/databaseUtils";
import app from "..";
import { MissionEnum } from '../controllers/enums/MissionEnum';
import MissionTypeModel from '../models/MissionTypeModel';
import MissionModel from '../models/MissionModel';
import PictureModel from '../models/PictureModel';
import AccountMissionAssignModel from '../models/AccountMissionAssignModel';
import { generateAuthTokenForTest } from './Utils/TestProvider';
import path from 'path';
import fs from 'fs';

let authToken: string;
let missionId: number;

beforeAll(async () => {
    await resetDatabase();

    authToken = await generateAuthTokenForTest();

    await MissionTypeModel.create({
        id: 1,
        longLibel: "Test Mission Type",
        shortLibel: "Test"
    });
});

beforeEach(async () => {
    await AccountMissionAssignModel.destroy({ where: {}, force: true });
    await PictureModel.destroy({ where: {}, force: true });
    await MissionModel.destroy({ where: {}, force: true });

    const mission = await MissionModel.create({
        description: "Test mission",
        timeBegin: new Date(),
        address: "Test address",
        idMissionType: 1
    });

    missionId = mission.id;

    if (process.env.FILES_UPLOAD_OUTPUT) {
        const uploadDir = process.env.FILES_UPLOAD_OUTPUT;
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const testImagePath = path.join(uploadDir, 'test_image.png');
        fs.writeFileSync(testImagePath, 'fake_image_content');

        await PictureModel.create({
            name: 'test_image.png',
            alt: 'Test image',
            path: testImagePath,
            idMission: mission.id
        });
    }
});

afterAll(async () => {
    await sequelize.close();

    if (process.env.FILES_UPLOAD_OUTPUT) {
        try {
            const uploadDir = process.env.FILES_UPLOAD_OUTPUT;
            const files = fs.readdirSync(uploadDir);
            files.forEach(file => {
                fs.unlinkSync(path.join(uploadDir, file));
            });
        } catch (error) {
            console.error("Erreur lors de la suppression des fichiers uploadés :", error);
        }
    }
});

describe('Suppression d\'une mission', () => {
    test('Test de la suppression d\'une mission existante', async () => {
        const response = await request(app)
            .delete(`/api/mission/${missionId}`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe(MissionEnum.MISSION_SUCCESSFULLY_DELETED);

        const mission = await MissionModel.findByPk(missionId);
        expect(mission).toBeNull();

        if (process.env.FILES_UPLOAD_OUTPUT) {
            const testImagePath = path.join(process.env.FILES_UPLOAD_OUTPUT, 'test_image.png');
            expect(fs.existsSync(testImagePath)).toBe(false);
        }
    });

    test('Test de la suppression d\'une mission inexistante', async () => {
        const response = await request(app)
            .delete('/api/mission/999999')
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe(MissionEnum.MISSION_NOT_FOUND);
    });

    test('Test de la suppression d\'une mission sans token d\'authentification', async () => {
        const response = await request(app)
            .delete(`/api/mission/${missionId}`);

        expect(response.status).toBe(401);
    });

    test('Test de la suppression d\'une mission avec des fichiers non existants', async () => {
        if (process.env.FILES_UPLOAD_OUTPUT) {
            const testImagePath = path.join(process.env.FILES_UPLOAD_OUTPUT, 'test_image.png');
            if (fs.existsSync(testImagePath)) {
                fs.unlinkSync(testImagePath);
            }
        }

        const response = await request(app)
            .delete(`/api/mission/${missionId}`)
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe(MissionEnum.MISSION_SUCCESSFULLY_DELETED);
    });
});