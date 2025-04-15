import request from "supertest";
import { resetDatabase } from "../../utils/databaseUtils";
import app from "../..";
import sequelize from "../../config/sequelize";
import { ErrorEnum } from "../../enums/errorEnum";
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
            phoneNumber: "1234567890",
        });

    authToken = userResponse.body.token;

    const upadateResponse = await request(app)
        .patch("/api/employee/1")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
            address: "TestAddress",
            city: "TestCity",
            postalCode: "49160",
            hiringDate: "2023-10-01",
            delay: 3,
            absence: 1
        });
});

afterAll(async () => {
    await sequelize.close();
});

describe("Employee API", () => {
    test("Doit récupérer un employé par ID", async () => {
        const response = await request(app)
            .get("/api/employee/1")
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("id", 1);
        expect(response.body).not.toHaveProperty("password");
    });

    test("Doit retourner une erreur si l'ID est invalide", async () => {
        const response = await request(app)
            .get("/api/employee/abc")
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", ErrorEnum.ACCOUNT_NOT_FOUND);
    });

    test("Doit retourner une erreur si l'employé n'existe pas", async () => {
        const response = await request(app)
            .get("/api/employee/99999")
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("error", ErrorEnum.ACCOUNT_NOT_FOUND);
    });

    test("Doit empêcher un utilisateur non authentifié d'accéder aux infos d'un autre utilisateur via l'ID", async () => {
        const response = await request(app).get("/api/employee/1");

        expect(response.status).toBe(401);
    });

    test("Doit retourner toutes les données d'un compte", async () => {
        const response = await request(app)
            .get("/api/employee/1")
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);

        expect(response.body).toHaveProperty("firstName", "John");
        expect(response.body).toHaveProperty("lastName", "Doe");
        expect(response.body).toHaveProperty("email", "john.doe@example.com");
        expect(response.body).toHaveProperty("phoneNumber", "1234567890");
        expect(response.body).toHaveProperty("address", "TestAddress");
        expect(response.body).toHaveProperty("city", "TestCity");
        expect(response.body).toHaveProperty("postalCode", "49160");
        expect(response.body).toHaveProperty("hiringDate", "2023-10-01T00:00:00.000Z");
        expect(response.body).toHaveProperty("delay", 3);
        expect(response.body).toHaveProperty("absence", 1);
        expect(response.body).toHaveProperty("notificationMail", true);
        expect(response.body).toHaveProperty("notificationSms", false);
        expect(response.body).toHaveProperty("isEnabled", true);
        expect(response.body).not.toHaveProperty("password");
    });
});