import request from 'supertest';
import app  from '../..';
import { resetDatabase } from '../../utils/databaseUtils';
import sequelize from '../../config/sequelize';

let authToken: string;

beforeEach(async () => {
    await resetDatabase();

    const userResponse = await request(app)
    .post('/api/auth/register')
    .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        address: "123 Main St",
        postalCode: "12345",
        city: "Paris",
        hiringDate: new Date("2024-04-14T12:00:00Z"),
        phoneNumber: '1234567890',
    });

    authToken = userResponse.body.token;
    console.log("authToken :", authToken);
});
  
afterAll(async () => {
    await sequelize.close();
})
  
describe('GET /role', () => {
    test.only('Doit retourner la liste des rôles', async () => {
        const response = await request(app)
        .get('/api/role')
        .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
    });

    test("Doit demander l'authentification", async () => {
        const response = await request(app)
        .get('/api/role');

        expect(response.status).toBe(401);
    });
});

