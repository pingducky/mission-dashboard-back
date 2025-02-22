import request from "supertest";
import app from "..";
import { resetDatabase, resetTable } from "../utils/databaseUtils";
import { ErrorEnum } from "../enums/errorEnum";
import sequelize from "../config/sequelize";
import EmployeRepository from '../repositories/EmployeRepository';
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

    authToken = userResponse.body.token; // Pas besoin d’un login après register
});

beforeEach(async () => {
    //await resetTable('AccountModel'); // Adapte selon le bon modèle
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

    test("Doit créer un employé et le retrouver dans la liste", async () => {
        const createResponse = await request(app)
            .post("/api/register")
            .send({
                firstName: "Alice",
                lastName: "Smith",
                email: "alice.smith@example.com",
                password: "password123",
                phoneNumber: "9876543210",
            });

        expect(createResponse.status).toBe(201);
        expect(createResponse.body).toHaveProperty("token");

        const newAuthToken = createResponse.body.token;

        const employeesResponse = await request(app)
            .get("/api/employees")
            .set("Authorization", `Bearer ${newAuthToken}`);

        expect(employeesResponse.status).toBe(200);
        expect(employeesResponse.body.length).toBeGreaterThan(0);
    });

    test("Doit empêcher un utilisateur non authentifié d'accéder à la liste des employés", async () => {
        const response = await request(app).get("/api/employees");

        expect(response.status).toBe(401);
    });

    test("Doit gérer une erreur du service lors de la récupération des employés", async () => {
        jest.spyOn(EmployeRepository, "getAll").mockImplementation(() => {
            throw new Error("Service Error");
        });

        const response = await request(app)
            .get("/api/employees")
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", "Service Error");
    });

    test("Doit récupérer un employé par ID", async () => {
        const response = await request(app)
            .get("/api/employees/1")
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("id", 1);
    });

    test("Doit retourner une erreur si l'ID est invalide", async () => {
        const response = await request(app)
            .get("/api/employees/abc")
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", ErrorEnum.ACCOUNT_NOT_FOUND);
    });

    test("Doit retourner une erreur si l'employé n'existe pas", async () => {
        const response = await request(app)
            .get("/api/employees/99999")
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("error", ErrorEnum.ACCOUNT_NOT_FOUND);
    });

    test("Doit empêcher un utilisateur non authentifié d'accéder aux infos d'un autre utilisateur via l'ID", async () => {
        const response = await request(app).get("/api/employees/1");

        expect(response.status).toBe(401);
    });

    test("Doit gérer une erreur du service lors de la récupération d'un employé par ID", async () => {
        jest.spyOn(EmployeRepository, "getById").mockImplementation(() => {
            throw new Error("Unexpected error");
        });

        const response = await request(app)
            .get("/api/employees/1")
            .set("Authorization", `Bearer ${authToken}`);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", "Unexpected error");
    });

    test("Doit mettre à jour un employé", async () => {
        const response = await request(app)
            .patch("/api/employees/1")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ lastName: "Johnson" });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("lastName", "Johnson");
    });

    test("Doit retourner une erreur si les données de mise à jour sont invalides", async () => {
        const response = await request(app)
            .patch("/api/employees/1")
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
            .patch("/api/employees/1")
            .set("Authorization", `Bearer ${authToken}`)
            .send({});

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", ErrorEnum.UPDATE_EMPTY);
    });

    test("Doit retourner une erreur si la mise à jour d'un employé échoue", async () => {
        const response = await request(app)
            .patch("/api/employees/99999")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ lastName: "Johnson" });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("error", ErrorEnum.ACCOUNT_NOT_FOUND);
    });

    test("Doit empêcher un utilisateur non authentifié de modifier les infos d'un autre utilisateur via l'ID", async () => {
        const response = await request(app)
            .patch("/api/employees/1")
            .send({ lastName: "Johnson" });

        expect(response.status).toBe(401);
    });

    test("Doit gérer une erreur du service lors de la mise à jour d'un employé", async () => {
        jest.spyOn(EmployeRepository, "update").mockImplementation(() => {
            throw new Error("Database Error");
        });

        const response = await request(app)
            .patch("/api/employees/1")
            .set("Authorization", `Bearer ${authToken}`)
            .send({ lastName: "UpdatedLastName" });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", "Database Error");
    });
});