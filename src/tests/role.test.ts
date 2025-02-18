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

    const loginResponse = await request(app)
    .post('/api/login')
    .send({
        email: 'john.doe@example.com',
        password: 'password123',
    });

    authToken = loginResponse.body.token;
});
  
afterAll(async () => {
    await sequelize.close();
})
  
describe('API roles', () => {
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