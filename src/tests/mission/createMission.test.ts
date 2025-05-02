import request from 'supertest';
import sequelize from "../../config/sequelize";
import { resetDatabase } from "../../utils/databaseUtils";
import app from "../..";
import { ErrorEnum } from '../../enums/errorEnum';
import MissionTypeModel from '../../models/MissionTypeModel';
import { MissionEnum } from '../../controllers/enums/MissionEnum';
import path from 'path';
import fs from 'fs';
import AccountMissionAssignModel from '../../models/AccountMissionAssignModel';
import MissionModel from '../../models/MissionModel';
import PictureModel from '../../models/PictureModel';
import { generateAuthTokenForTest } from '../Utils/TestProvider';

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
        expect(response.body.error).toBe(ErrorEnum.MISSING_REQUIRED_FIELDS);
    })

    test('Test de création de mission sans les champs facultatif', async () => {
        const response = await request(app)
        .post('/api/mission')
        .send({
            description: "Good description",
            timeBegin: "2025-02-17T10:00:00Z",
            address: "Good adresse",
            city: "Good city",
            postalCode: "75000",
            countryCode: "FR",
            missionTypeId: 1,
            accountAssignIds: JSON.stringify([1])
        })
        .set("Authorization", `Bearer ${authToken}`)

        expect(response.status).toBe(201);
        expect(response.body).toEqual(
            {
                missionId: 1,
                assignedAccountIds: [ 1 ],
                failedAssignments: [],
                rejectedFiles: [],
                uploadedFiles: []
            }
        );
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
                city: "Good city",
                postalCode: "75000",
                countryCode: "FR",
                accountAssignIds: JSON.stringify([1]),
                missionTypeId: 1,
                pictures: []
            })
            .set("Authorization", `Bearer ${authToken}`)

            expect(response.status).toBe(201);
    })

    test('Test de la création d\'une mission avec upload d\'une image associé.', async () => {
        if (!process.env.FILES_UPLOAD_OUTPUT) {
            throw new Error('FILES_UPLOAD_OUTPUT doit être configuré pour que les tests d\'upload fonctionnent.');
        }
        const imagePath = path.resolve(__dirname, '../upload/input/test_upload_image.png');
        if (!fs.existsSync(imagePath)) throw new Error("Fichier image introuvable");
        
        const response = await request(app)
        .post('/api/mission')
        .field("description", "Good description")
        .field("timeBegin", "2025-02-17T10:00:00Z")
        .field("timeEnd", "2025-02-17T10:00:00Z")
        .field("estimatedEnd", "2025-02-17T10:00:00Z")
        .field("address", "Good address")
        .field("city", "Paris")
        .field("postalCode", "75000")
        .field("countryCode", "FR")
        .field("accountAssignIds", JSON.stringify([1]))
        .field("missionTypeId", 1)
        .set("Authorization", `Bearer ${authToken}`)
        .attach("pictures", imagePath);

        expect(response.status).toBe(201);
        expect(fs.existsSync(process.env.FILES_UPLOAD_OUTPUT + path.basename(response.body.uploadedFiles[0]))).toBe(true)
    });

    test('Test de la création d\'une mission avec upload d\'un fichier qui n\'est pas une image.', async () => {
        if (!process.env.FILES_UPLOAD_OUTPUT) {
            throw new Error('FILES_UPLOAD_OUTPUT doit être configuré pour que les tests d\'upload fonctionnent.');
        }

        const imagePath = path.resolve(__dirname, '.\\..\\upload\\input\\test_upload_document.docx');
        const requestBuilder = request(app)
        .post('/api/mission')
        .field("description", "Good description")
        .field("timeBegin", "2025-02-17T10:00:00Z")
        .field("address", "Good adresse")
        .field("city", "Good city")
        .field("postalCode", "75000")
        .field("countryCode", "FR")
        .field("missionTypeId", 1)
        .field("accountAssignIds", JSON.stringify([1]))
        .set("Authorization", `Bearer ${authToken}`);
        requestBuilder.attach("pictures", imagePath);

        const response = await requestBuilder;
        expect(response.status).toBe(201);
        expect(response.body.rejectedFiles[0].id).toEqual('test_upload_document.docx')
    });

    test('Test de création de mission avec aucun idAccount qui ne peut être assigné', async () => {
        const response = await request(app)
        .post('/api/mission')
        .send({
            description: "Good description",
            timeBegin: "2025-02-17T10:00:00Z",
            address: "Good adresse",
            city: "Good city",
            postalCode: "75000",
            countryCode: "FR",
            missionTypeId: 1,
            accountAssignIds: JSON.stringify([66])
        })
        .set("Authorization", `Bearer ${authToken}`)
        expect(response.status).toBe(400);
        expect(response.body.error).toEqual(MissionEnum.BAD_ACCOUNT_ASSIGNATION)
    })

    test('Test de création de mission avec au moins un compte qui peut être assigné', async () => {
        const response = await request(app)
        .post('/api/mission')
        .send({
            description: "Good description",
            timeBegin: "2025-02-17T10:00:00Z",
            address: "Good adresse",
            city: "Good city",
            postalCode: "75000",
            countryCode: "FR",
            missionTypeId: 1,
            accountAssignIds: JSON.stringify([1,666])
        })
        .set("Authorization", `Bearer ${authToken}`)
        expect(response.status).toBe(201);
        expect(response.body.failedAssignments).toEqual(([{ accountId: 666, reason: 'Compte inexistant' }]))
    })

    test('Test de création de mission avec un type de mission inexistant', async () => {
        const response = await request(app)
        .post('/api/mission')
        .send({
            description: "Good description",
            timeBegin: "2025-02-17T10:00:00Z",
            address: "Good adresse",
            city: "Good city",
            postalCode: "75000",
            countryCode: "FR",
            missionTypeId: 100,
            accountAssignIds: JSON.stringify([1])
        })
        .set("Authorization", `Bearer ${authToken}`)
        
        expect(response.status).toBe(400);
        
        expect(response.body.error).toEqual(MissionEnum.MISSION_TYPE_DOESNT_EXIST)
    })
});