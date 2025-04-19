import request from 'supertest';
import sequelize from '../../config/sequelize';
import { resetDatabase } from '../../utils/databaseUtils';
import app from '../..';
import path from 'path';
import fs from 'fs';
import MissionTypeModel from '../../models/MissionTypeModel';
import { MissionEnum } from '../../controllers/enums/MissionEnum';
import { generateAuthTokenForTest } from '../Utils/TestProvider';
import MissionModel from '../../models/MissionModel';
import MessageModel from '../../models/MessageModel';
import PictureModel from '../../models/PictureModel';

let authToken: string;
let missionIdToDelete: number;

beforeAll(async () => {
    await resetDatabase();

    authToken = await generateAuthTokenForTest();

    await MissionTypeModel.create({
        id: 1,
        longLibel: 'Test Long Libel',
        shortLibel: 'Test'
    });

    const response = await request(app)
        .post('/api/mission')
        .send({
            description: 'Mission à supprimer',
            timeBegin: '2025-02-17T10:00:00Z',
            address: 'Adresse',
            missionTypeId: 1
        })
        .set('Authorization', `Bearer ${authToken}`);

    missionIdToDelete = response.body.mission.id;
});

afterAll(async () => {
    await sequelize.close();

    // Supprimer les fichiers uploadés
    if (process.env.FILES_UPLOAD_OUTPUT) {
        const uploadDir = process.env.FILES_UPLOAD_OUTPUT;
        if (fs.existsSync(uploadDir)) {
            fs.readdirSync(uploadDir).forEach(file => {
                fs.unlinkSync(path.join(uploadDir, file));
            });
        }
    }
});

describe('Suppression de mission', () => {
    test('Doit supprimer une mission existante avec succès', async () => {
        const response = await request(app)
            .delete(`/api/mission/${missionIdToDelete}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe(MissionEnum.MISSION_SUCCESSFULLY_DELETED);

        const verify = await MissionModel.findByPk(missionIdToDelete);
        expect(verify).toBeNull();
    });

    test('Doit retourner une erreur pour un ID de mission invalide', async () => {
        const response = await request(app)
            .delete('/api/mission/abc')
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(MissionEnum.INVALID_MISSION_ID);
    });

    test('Doit retourner une erreur si la mission n\'existe pas', async () => {
        const response = await request(app)
            .delete('/api/mission/99999')
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe(MissionEnum.MISSION_NOT_FOUND);
    });

    test('Doit empêcher un utilisateur non authentifié de supprimer une mission', async () => {
        const response = await request(app)
            .delete(`/api/mission/${missionIdToDelete}`);

        expect(response.status).toBe(401);
    });

    test('Doit supprimer une mission avec image et commentaire en utilisant l\'upload réel', async () => {
        if (!process.env.FILES_UPLOAD_OUTPUT) {
            throw new Error('FILES_UPLOAD_OUTPUT doit être défini pour les tests d\'upload.');
        }

        const imagePath = path.resolve(__dirname, '..', 'upload', 'input', 'test_upload_image.png');

        // Crée la mission
        const requestBuilder = request(app)
            .post('/api/mission')
            .field("description", "Mission à supprimer")
            .field("timeBegin", "2025-02-17T10:00:00Z")
            .field("address", "Adresse complète")
            .field("missionTypeId", 1)
            .set("Authorization", `Bearer ${authToken}`);

        await requestBuilder.attach("pictures", imagePath);
        const response = await requestBuilder;

        const missionId = response.body.mission.id;
        const uploadedFileName = path.basename(response.body.accepedUploadedFiles[0]);
        const uploadedFilePath = path.join(process.env.FILES_UPLOAD_OUTPUT, uploadedFileName);

        // Ajoute un commentaire à la mission
        await MessageModel.create({
            idMission: missionId,
            idAccount: 1,
            message: 'Commentaire test'
        });

        expect(fs.existsSync(uploadedFilePath)).toBe(true);

        // Supprime la mission
        const deleteRes = await request(app)
            .delete(`/api/mission/${missionId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(deleteRes.status).toBe(200);
        expect(deleteRes.body.message).toBe(MissionEnum.MISSION_SUCCESSFULLY_DELETED);

        // Vérifie que tout a été supprimé
        const missionAfter = await MissionModel.findByPk(missionId);
        const msgAfter = await MessageModel.findAll({ where: { idMission: missionId } });
        const picAfter = await PictureModel.findAll({ where: { idMission: missionId } });

        expect(missionAfter).toBeNull();
        expect(msgAfter.length).toBe(0);
        expect(picAfter.length).toBe(0);
        expect(fs.existsSync(uploadedFilePath)).toBe(false);
    });

    test.skip('TODO: Vérifie la suppression physique des fichiers liés à une mission', () => {
    });
});