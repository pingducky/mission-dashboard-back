import request from "supertest";
import { resetDatabase } from "../../utils/databaseUtils";
import app from '../../app';
import sequelize from "../../config/sequelize";
import AccountModel from "../../models/AccountModel";
import TokenModel from "../../models/TokenModel";

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

    await AccountModel.bulkCreate(users);
});

afterAll(async () => {
    await TokenModel.destroy({ where: {} });
    await AccountModel.destroy({ where: {} });
    await sequelize.close();
});

describe("Employee API", () => {
    test("Doit récupérer tous les employés sans filtre", async () => {
        const response = await request(app)
            .get("/api/employee")
            .set("Authorization", `Bearer ${authToken}`);
    
        expect(response.status).toBe(200);
        expect(response.body).toEqual([
            expect.objectContaining({
                id: 1,
                email: 'john.doe@example.com'
            }),
            expect.objectContaining({
                id: 2,
                email: 'jane.smith2@example.com'
            }),
            expect.objectContaining({
                id: 3,
                email: 'jane.smith3@example.com'
            }),
            expect.objectContaining({
                id: 4,
                email: 'jane.smith4@example.com'
            })
        ]
        );
    });

    test("Doit récupérer uniquement les employés actifs", async () => {
        const res = await request(app)
            .get("/api/employee?status=active")
            .set("Authorization", `Bearer ${authToken}`);
    
        expect(res.status).toBe(200);
        expect(res.body).toEqual([
            expect.objectContaining({
                id: 1,
                email: 'john.doe@example.com',
                isEnabled: true
            }),
            expect.objectContaining({
                id: 2,
                email: 'jane.smith2@example.com',
                isEnabled: true
            }),
            expect.objectContaining({
                id: 3,
                email: 'jane.smith3@example.com',
                isEnabled: true
            }),
        ]
        );
    });

    test("Doit récupérer uniquement les employés inactifs", async () => {
        const res = await request(app)
            .get("/api/employee?status=inactive")
            .set("Authorization", `Bearer ${authToken}`);
        
        expect(res.status).toBe(200);
        expect(res.body).toEqual([
            expect.objectContaining({
                id: 4,
                email: 'jane.smith4@example.com',
                isEnabled: false
            })
        ]
        );
    });

    test("Doit récupérer uniquement les employés en ligne", async () => {
        const res = await request(app)
            .get("/api/employee?status=online")
            .set("Authorization", `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual([
            expect.objectContaining({
                id: 3,
                email: 'jane.smith3@example.com',
                isOnline: true
            })
        ]);
    });

    test("Doit récupérer tous les employés avec un filtre invalide", async () => {
        const res = await request(app)
            .get("/api/employee?status=invalidFilter")
            .set("Authorization", `Bearer ${authToken}`);
    
        expect(res.status).toBe(200);
        expect(res.body).toEqual([
            expect.objectContaining({
                id: 1,
                email: 'john.doe@example.com'
            }),
            expect.objectContaining({
                id: 2,
                email: 'jane.smith2@example.com'
            }),
            expect.objectContaining({
                id: 3,
                email: 'jane.smith3@example.com'
            }),
            expect.objectContaining({
                id: 4,
                email: 'jane.smith4@example.com'
            })
        ]);
    });

    test("Ne doit jamais retourner le mot de passe des employés", async () => {
        const res = await request(app)
            .get("/api/employee")
            .set("Authorization", `Bearer ${authToken}`);

        expect(res.status).toBe(200);

        res.body.forEach((employee: any) => {
            expect(employee).not.toHaveProperty("password");
        });
    });
});