import request from "supertest";
import { resetDatabase } from "../../utils/databaseUtils";
import app from "../..";
import sequelize from "../../config/sequelize";
let authToken: string;

beforeAll(async () => {
    await resetDatabase();

    const user1 = await request(app)
        .post("/api/auth/register")
        .send({
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
            password: "password123",
            phoneNumber: "1234567890",
        });

    const user2 = await request(app)
        .post("/api/auth/register")
        .send({
            firstName: "Jane",
            lastName: "Smith",
            email: "jane.smith@example.com",
            password: "password123",
            phoneNumber: "0987654321",
        });

    // Authentification avec le premier user 1
    authToken = user1.body.token;

    // Modification manuel de l'état du user 2
    await request(app)
        .put(`/api/employee/${user2.body.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
            isEnabled: false,
            isOnline: true,
        });
});

afterAll(async () => {
    await sequelize.close();
});

describe("Employee API", () => {
    test("Doit récupérer tous les employés", async () => {
        const response = await request(app)
            .get("/api/employee")
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test("Doit récupérer uniquement les employés actifs", async () => {
        const res = await request(app)
            .get("/api/employee?status=active")
            .set("Authorization", `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        res.body.forEach((emp: any) => {
            expect(emp.isEnabled).toBe(true);
        });
    });

    test("Doit récupérer uniquement les employés inactifs", async () => {
        const res = await request(app)
            .get("/api/employee?status=inactive")
            .set("Authorization", `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        res.body.forEach((emp: any) => {
            expect(emp.isEnabled).toBe(false);
        });
    });

    test("Doit récupérer uniquement les employés en ligne", async () => {
        const res = await request(app)
            .get("/api/employee?status=online")
            .set("Authorization", `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        res.body.forEach((emp: any) => {
            expect(emp.isOnline).toBe(true);
        });
    });

    test("Doit empêcher un utilisateur non authentifié d'accéder à la liste des employés", async () => {
        const response = await request(app).get("/api/employee");

        expect(response.status).toBe(401);
    });
});