import request from "supertest";
import { resetDatabase } from "../../utils/databaseUtils";
import app from "../..";
import sequelize from "../../config/sequelize";
let authToken: string;

beforeAll(async () => {
    await resetDatabase();

    const userResponse = await request(app)
        .post("/api/register")
        .send({
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
            password: "password123",
            phoneNumber: "1234567890",
        });

    authToken = userResponse.body.token;
});

afterAll(async () => {
    await sequelize.close();
});

describe("Employee API", () => {
    test("Doit récupérer tous les employés", async () => {
        const response = await request(app)
            .get("/api/employees")
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test("Doit retourner une liste vide si aucun employé n'existe", async () => {
        await resetDatabase();

        const response = await request(app)
            .get("/api/employees")
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    test("Doit empêcher un utilisateur non authentifié d'accéder à la liste des employés", async () => {
        const response = await request(app).get("/api/employees");

        expect(response.status).toBe(401);
    });
});