import request from 'supertest';
import { resetDatabase } from '../../utils/databaseUtils';
import sequelize from '../../config/sequelize';
import app from '../../app';
import { ErrorEnum } from '../../enums/errorEnum';

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
    await sequelize.close();
})

describe('Inscription API', () => {
    test('Doit créé un nouveau compte et retourner le token', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123',
          phoneNumber: '1234567890',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
    });

    test('Doit retourner une erreur si un champ requis est manquant', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe(ErrorEnum.MISSING_REQUIRED_FIELDS);
    });


    test('Doit retourner une erreur si l\'email est déjà utilisé', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123',
          phoneNumber: '1234567890',
        });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'john.doe@example.com',
          password: 'newpassword123',
          phoneNumber: '0987654321',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe(ErrorEnum.EMAIL_ALREADY_USED);
    });
    test('Doit retourner une erreur si l\'email est invalide', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'invalid-email',
          password: 'password123',
          phoneNumber: '1234567890',
        });
  
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe(ErrorEnum.INVALID_EMAIL);
    });
  });
  