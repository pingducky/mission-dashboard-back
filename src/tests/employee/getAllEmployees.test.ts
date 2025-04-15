import request from "supertest";
import { resetDatabase } from "../../utils/databaseUtils";
import app from "../..";
import sequelize from "../../config/sequelize";
import AccountModel from "../../models/AccountModel";
import { afterEach } from "node:test";

let authToken: string;

const defaultUser = {
    firstName: "Jane",
    lastName: "Smith",
    password: "password123",
    phoneNumber: "0987654321",
};

const users = [
    {
        ...defaultUser,
        id: 2,
        email: "jane.smith2@example.com",
        isEnabled: true,
        isOnline: false,
    },
    {
        ...defaultUser,
        id: 3,
        email: "jane.smith3@example.com",
        isEnabled: true,
        isOnline: true,
    },
    {
        ...defaultUser,
        id: 4,
        email: "jane.smith4@example.com",
        isEnabled: false,
        isOnline: false,
    }
];

afterEach(async() => { // remet a zéro mes account entre chaque test
    await AccountModel.destroy({ where: {}, truncate: true });
})

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

    try {
        const insertedUsers = await AccountModel.bulkCreate(users);
        console.log("Utilisateurs insérés:", insertedUsers);
    } catch (error) {
        console.error("Erreur lors de l'insertion des utilisateurs:", error);
    }
});

afterAll(async () => {
    // await AccountModel.destroy({ where: {} });

    await AccountModel.truncate();
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
    
        console.log('Réponse API:', res.body);  // Afficher la réponse API pour inspecter les données
    
        expect(res.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: 1, isEnabled: true }),
                expect.objectContaining({ id: 2, isEnabled: true }),
                expect.objectContaining({ id: 3, isEnabled: true })
            ])
        );
    });

    // test("Doit récupérer uniquement les employés inactifs", async () => {
    //     const res = await request(app)
    //         .get("/api/employee?status=inactive")
    //         .set("Authorization", `Bearer ${authToken}`);

    //     expect(res.status).toBe(200);
    //     res.body.forEach((emp: any) => {
    //         expect(emp.isEnabled).toBe(false);
    //     });
    // });

    // test("Doit récupérer uniquement les employés en ligne", async () => {
    //     const res = await request(app)
    //         .get("/api/employee?status=online")
    //         .set("Authorization", `Bearer ${authToken}`);

    //     expect(res.status).toBe(200);
    //     res.body.forEach((emp: any) => {
    //         expect(emp.isOnline).toBe(true);
    //     });
    // });

    test("Doit empêcher un utilisateur non authentifié d'accéder à la liste des employés", async () => {
        const response = await request(app).get("/api/employee");

        expect(response.status).toBe(401);
    });
});