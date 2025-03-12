import request from 'supertest';
import sequelize from "../../config/sequelize";
import { resetDatabase } from "../../utils/databaseUtils";
import app from "../..";
import { ErrorEnum } from '../../enums/errorEnum';
import MissionTypeModel from '../../models/MissionTypeModel';
import { MissionEnum } from '../../controllers/enums/MissionEnum';
import { generateAuthTokenForTest } from '../Utils/TestProvider';
let authToken: string;


beforeEach(async () => {
    await resetDatabase();

    authToken = await generateAuthTokenForTest();

    // Création d'un type de modèle
    await MissionTypeModel.create({
        id: 1,
        longLibel: "Test Mission Type",
        shortLibel: "Test"
    });
});

afterAll(async () => {
    await sequelize.close();
});
  
describe('PUT /mission/:id', () => {
    test("Doit modifier une mission", async () => {
    });

    test("Doit retourner une erreur, la mission n'existe pas", async () => {
    });

    test("Doit retourner une erreur, le type de mission n'existe pas", async () => {
    });

    test("Doit retourner une erreur, champs manquants", async () => {
    });

    test("Doit retourner une erreur, date invalide", async () => {
    });

    test("Doit retourner une erreur, authentification requise", async () => {
    });
});