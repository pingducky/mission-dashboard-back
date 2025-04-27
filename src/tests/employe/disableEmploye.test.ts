import request from "supertest";
import app from '../../app';
import { resetDatabase } from "../../utils/databaseUtils";
import { ErrorEnum } from "../../enums/errorEnum";
import sequelize from "../../config/sequelize";
import { generateAuthTokenForTest, giveAdminRole, initRoles } from "../Utils/TestProvider";

let authToken: string;

beforeEach(async () => {
    await resetDatabase();

    authToken = await generateAuthTokenForTest();
    await initRoles();
});

afterAll(async () => {
    await sequelize.close();
});

describe("PUT /employee/:id/disable", () => {
    test("Dois retourner une erreur si l\'utilisateur n'a pas les droits.", async () => {
        const response = await request(app)
            .put("/api/employee/1/disable")
            .set("Authorization", `Bearer ${authToken}`);
        
        expect(response.status).toBe(401);
        expect(response.body.error).toBe(ErrorEnum.UNAUTHORIZED);
    });

    test("Doit désactiver l'employé", async () => {
        await giveAdminRole();

        const response = await request(app)
            .put("/api/employee/1/disable")
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(204);
    });

    test("Doit demander l'authentification", async () => {

        const response = await request(app)
        .put("/api/employee/1/disable")

        expect(response.status).toBe(401);
    });

    test("Doit retourner une erreur si l'employé n'existe pas", async () => {
        await giveAdminRole();

        const response = await request(app)
        .put("/api/employee/9999/disable")
        .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(ErrorEnum.ACCOUNT_NOT_FOUND);
    });
});