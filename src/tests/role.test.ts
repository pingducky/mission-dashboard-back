import request from 'supertest';
import app  from '..';
import { resetDatabase } from '../utils/databaseUtils';
import { ErrorEnum } from '../enums/errorEnum';
import sequelize from '../config/sequelize';

let authToken: string;

beforeEach(async () => {
    await resetDatabase();

    const userResponse = await request(app)
    .post('/api/register')
    .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phoneNumber: '1234567890',
    });

    authToken = userResponse.body.token;
});
  
afterAll(async () => {
    await sequelize.close();
})
  
describe('GET /roles', () => {
    test('Doit retourner la liste des rôles', async () => {
        const response = await request(app)
        .get('/api/roles')
        .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
    });

    test("Doit demander l'authentification", async () => {
        const response = await request(app)
        .get('/api/roles');

        expect(response.status).toBe(401);
    });
});

describe('POST /role', () => {
    test('Doit créer un rôle', async () => {
        const response = await request(app)
        .post('/api/role')
        .set("Authorization", `Bearer ${authToken}`)
        .send({
            shortLibel: 'ADMIN',
            longLibel: 'Administrateur',
        });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('ShortLibel', 'ADMIN');
        expect(response.body).toHaveProperty('LongLibel', 'Administrateur');
    });

    test('Doit retourner une erreur si des champs sont manquants', async () => {
        const response = await request(app)
        .post('/api/role')
        .set("Authorization", `Bearer ${authToken}`)
        .send({
            shortLibel: 'ADMIN',
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', ErrorEnum.MISSING_REQUIRED_FIELDS);
    });

    test('Doit retourner une erreur si des champs sont invalides', async () => {
        const response = await request(app)
        .post('/api/role')
        .set("Authorization", `Bearer ${authToken}`)
        .send({
            shortLibel: 'ADMIN',
            longLibel: 'Administrateur'.repeat(10),
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', ErrorEnum.INVALID_FIELDS_LENGTH);
    });

    test("Doit demander l'authentification", async () => {
        const response = await request(app)
        .post('/api/role')
        .send({
            shortLibel: 'ADMIN',
            longLibel: 'Administrateur',
        });

        expect(response.status).toBe(401);
    });
});