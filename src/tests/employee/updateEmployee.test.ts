import request from "supertest";
import { resetDatabase } from "../../utils/databaseUtils";
import app from "../..";
import sequelize from "../../config/sequelize";
import { ErrorEnum } from "../../enums/errorEnum";
import EmployeRepository from "../../repositories/EmployeRepository";
import { InternalServerError } from "../../Errors/InternalServerError";
let authToken: string;

beforeAll(async () => {
    await resetDatabase();

    const userResponse = await request(app)
        .post("/api/auth/register")
        .send({
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
            password: "password123",
            address: "123 Main St",
            postalCode: "12345",
            city: "Paris",
            hiringDate: new Date("2024-04-14T12:00:00Z"),
            phoneNumber: "1234567890",
        });

    authToken = userResponse.body.token;
});

afterAll(async () => {
    await sequelize.close();
});

describe("Employee API", () => {

    test("Doit mettre à jour un employé", async () => {
        const response = await request(app)
            .patch("/api/employee/1")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
                lastName: "Johnson",
                city: "New York",
                postalCode: "10001",
                hiringDate: "2023-10-01",
                delay: 2,
                absence: 1,
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("lastName", "Johnson");
        expect(response.body).toHaveProperty("city", "New York");
        expect(response.body).toHaveProperty("postalCode", "10001");
        expect(response.body).toHaveProperty("hiringDate", "2023-10-01T00:00:00.000Z");
        expect(response.body).toHaveProperty("delay", 2);
        expect(response.body).toHaveProperty("absence", 1);
    });

    test("Doit retourner une erreur si les données de mise à jour sont invalides", async () => {
        const response = await request(app)
            .patch("/api/employee/1")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
                firstName: "",
                email: "invalid-email",
            });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error");
    });

    test("Doit retourner une erreur si aucune donnée de mise à jour n'est fournie", async () => {
        const response = await request(app)
            .patch("/api/employee/1")
            .set("Authorization", `Bearer ${authToken}`)
            .send({});

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", ErrorEnum.UPDATE_EMPTY);
    });

    test("Doit retourner une erreur si la mise à jour d'un employé échoue", async () => {
        const response = await request(app)
            .patch("/api/employee/99999")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ lastName: "Johnson" });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("error", ErrorEnum.ACCOUNT_NOT_FOUND);
    });

    test("Doit empêcher un utilisateur non authentifié de modifier les infos d'un autre utilisateur via l'ID", async () => {
        const response = await request(app)
            .patch("/api/employee/1")
            .send({ lastName: "Johnson" });

        expect(response.status).toBe(401);
    });
});