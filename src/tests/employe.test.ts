import request from "supertest";
import app from "..";
import { resetDatabase } from "../utils/databaseUtils";
import { ErrorEnum } from "../enums/errorEnum";
import sequelize from "../config/sequelize";

let authToken: string;

beforeEach(async () => {
    await resetDatabase();

    const userResponse = await request(app)
      .post("/api/register")
      .send({
        firstName: "Jean",
        lastName: "DUPOND",
        email: "ff@ff.com",
        password: "Not24get",
        phoneNumber: "0123456789",
      });

    authToken = userResponse.body.token;
});

afterAll(async () => {
    await sequelize.close();
});

describe("PATCH /employees/:id/disable", () => {
    test("Doit désactiver l'employé", async () => {
        const response = await request(app)
            .patch("/api/employees/1/disable")
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test("Doit demander l'authentification", async () => {
        const response = await request(app)
        .patch("/api/employees/1/disable")
        .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(401);
    });

    test("Doit retourner une erreur si l'employé n'existe pas", async () => {
        const response = await request(app)
        .patch("/api/employees/9999/disable")
        .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe(ErrorEnum.ACCOUNT_NOT_FOUND);
        expect(response.body).toHaveProperty("message");
    });
});