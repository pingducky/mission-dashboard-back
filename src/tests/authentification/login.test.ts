import request from 'supertest';
import { resetDatabase } from '../../utils/databaseUtils';
import sequelize from '../../config/sequelize';
import app from '../..';
import { ErrorEnum } from '../../enums/errorEnum';

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
    await sequelize.close();
})

describe('Login API', () => {
  test('Doit connecter l\'utilisateur et retourner le token', async () => {
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
      .post('/api/auth/login')
      .send({
        email: 'john.doe@example.com',
        password: 'password123',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

  test('Doit retourner une erreur si l\'email est incorrect', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'wrong.email@example.com',
        password: 'password123',
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe(ErrorEnum.ACCOUNT_NOT_FOUND);
  });

  test('Doit retourner une erreur si le mot de passe est incorrect', async () => {
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
      .post('/api/auth/login')
      .send({
        email: 'john.doe@example.com',
        password: 'wrongpassword',
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe(ErrorEnum.PASSWORD_INVALID);
  });

  test('Doit retourner une erreur si l\'email est manquant', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        password: 'password123',
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe(ErrorEnum.MISSING_REQUIRED_FIELDS);
  });

  test('Doit retourner une erreur si le mot de passe est manquant', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'john.doe@example.com',
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe(ErrorEnum.MISSING_REQUIRED_FIELDS);
  });
});
