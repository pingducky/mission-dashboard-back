import request from 'supertest';
import sequelize from "../config/sequelize";
import { resetDatabase } from "../utils/databaseUtils";
import app from "..";
import { ErrorEnum } from '../enums/errorEnum';
import MissionTypeModel from '../models/MissionTypeModel';
import { MissionEnum } from '../controllers/enums/MissionEnum';
import path from 'path';
import fs from 'fs';
import { generateAuthTokenForTest } from './Utils/TestProvider';
import AccountMissionAssignModel from '../models/AccountMissionAssignModel';
import MissionModel from '../models/MissionModel';
import PictureModel from '../models/PictureModel';

let authToken: string;

beforeEach(async () => {
    await AccountMissionAssignModel.destroy({ where: {}, force: true });
    await PictureModel.destroy({ where: {}, force: true });
    await MissionModel.destroy({ where: {}, force: true });
  });

beforeAll(async () => {
    await resetDatabase();

    authToken = await generateAuthTokenForTest();

    // Création d'un type de modèle
    await MissionTypeModel.create({
        id: 1,
        longLibel: "Test Mission Type",
        shortLibel: "Test"
    });
})

afterAll(async () => {
    await sequelize.close();

    // Supprimer les fichiers upload une fois les tests terminé
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
  
  describe('Création d\'une mission', () => {
    test('Test des champs obligatoires manquants', async () => {
        const response = await request(app)
            .post('/api/mission')
            .send({})
            .set("Authorization", `Bearer ${authToken}`)
        

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(ErrorEnum.MISSING_REQUIRED_FIELDS);
    })

    test('Test de création de mission sans les champs facultatif', async () => {
        const response = await request(app)
        .post('/api/mission')
        .send({
            description: "Good description",
            timeBegin: "2025-02-17T10:00:00Z",
            address: "Good adresse",
            missionTypeId: 1,
        })
        .set("Authorization", `Bearer ${authToken}`)

        expect(response.status).toBe(201);
        expect(response.body.message).toEqual(MissionEnum.MISSION_SUCCESSFULLY_CREATED)
    })

    test('Test de création de mission avec tout les champs facultatif ou non facultatif (sauf les images)', async () => {
            const response = await request(app)
            .post('/api/mission')
            .send({
                description: "Good description",
                timeBegin: "2025-02-17T10:00:00Z",
                estimatedEnd: "2025-02-17T10:00:00Z",
                timeEnd:  "2025-02-17T10:00:00Z",
                address: "Good adresse",
                accountAssignId: 1,
                missionTypeId: 1,
                pictures: []
            })
            .set("Authorization", `Bearer ${authToken}`)

            expect(response.status).toBe(201);
            expect(response.body.mission).toMatchObject({
                description: 'Good description',
                timeBegin: '2025-02-17T10:00:00.000Z',
                timeEnd: '2025-02-17T10:00:00.000Z',
                estimatedEnd: '2025-02-17T10:00:00.000Z',
                address: 'Good adresse',
                idMissionType: 1
            });
    })
    test('Test de la création d\'une mission avec upload d\'une image associé.', async () => {
        if (!process.env.FILES_UPLOAD_OUTPUT) {
            throw new Error('FILES_UPLOAD_OUTPUT doit être configuré pour que les tests d\'upload fonctionnent.');
        }

        const imagePath = path.resolve(__dirname, 'upload\\input\\test_upload_image.png');

        const requestBuilder = request(app)
        .post('/api/mission')
        .field("description", "Good description")
        .field("timeBegin", "2025-02-17T10:00:00Z")
        .field("address", "Good adresse")
        .field("missionTypeId", 1)
        .set("Authorization", `Bearer ${authToken}`);
    
        await requestBuilder.attach("pictures", imagePath);

        const response = await requestBuilder;
        expect(response.status).toBe(201);
        
        expect(fs.existsSync(process.env.FILES_UPLOAD_OUTPUT + path.basename(response.body.accepedUploadedFiles[0]))).toBe(true)
    });

    test('Test de la création d\'une mission avec upload d\'un fichier qui n\'est pas une image.', async () => {
        console.log("TOTOTOTO")
        if (!process.env.FILES_UPLOAD_OUTPUT) {
            throw new Error('FILES_UPLOAD_OUTPUT doit être configuré pour que les tests d\'upload fonctionnent.');
        }

        const imagePath = path.resolve(__dirname, 'upload\\input\\test_upload_document.docx');
        const requestBuilder = request(app)
        .post('/api/mission')
        .field("description", "Good description")
        .field("timeBegin", "2025-02-17T10:00:00Z")
        .field("address", "Good adresse")
        .field("missionTypeId", 1)
        .set("Authorization", `Bearer ${authToken}`);
        requestBuilder.attach("pictures", imagePath);

        const response = await requestBuilder;
        expect(response.status).toBe(201);
        expect(response.body.rejectedUploadFiles).toEqual(['test_upload_document.docx'])
    });

    test('Test de création de mission avec un accountAssignId qui ne correspond à aucun compte', async () => {
        const response = await request(app)
        .post('/api/mission')
        .send({
            description: "Good description",
            timeBegin: "2025-02-17T10:00:00Z",
            address: "Good adresse",
            accountAssignId: 666,
            missionTypeId: 1,
        })
        .set("Authorization", `Bearer ${authToken}`)
        expect(response.status).toBe(404);
        expect(response.body.message).toEqual(MissionEnum.USER_NOT_FOUND)
    })

    test('Test de création de mission avec un type de mission inexistant', async () => {
        const response = await request(app)
        .post('/api/mission')
        .send({
            description: "Good description",
            timeBegin: "2025-02-17T10:00:00Z",
            address: "Good adresse",
            accountAssignId: 666,
            missionTypeId: 10,
        })
        .set("Authorization", `Bearer ${authToken}`)
        
        expect(response.status).toBe(400);
        
        expect(response.body.message).toEqual(MissionEnum.MISSION_TYPE_DOESNT_EXIST)
    })
});