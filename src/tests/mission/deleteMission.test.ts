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

let authToken: string;
let missionIdToDelete: number;

beforeAll(async () => {
    await resetDatabase();

    authToken = await generateAuthTokenForTest();

    // Créer un type de mission requis
    await MissionTypeModel.create({
        id: 1,
        longLibel: 'Test Long Libel',
        shortLibel: 'Test'
    });

    // Créer une mission pour test
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

        // Vérifier qu'elle est bien supprimée
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
});