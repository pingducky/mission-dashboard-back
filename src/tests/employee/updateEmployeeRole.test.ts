import request from "supertest";
import app from '../../app';
import { resetDatabase } from "../../utils/databaseUtils";
import { ErrorEnum } from "../../enums/errorEnum";
import sequelize from "../../config/sequelize";
import EmployeService from "../../services/enums/EmployeService";

let authToken: string;

beforeEach(async () => {
    await resetDatabase();

    const userResponse = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Jean",
        lastName: "DUPOND",
        email: "ff@ff.com",
        password: "Not24get",
        phoneNumber: "0123456789",
      });

    authToken = userResponse.body.token;

    await request(app)
        .post("/api/role")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
            shortLibel: "ADMIN",
            longLibel: "Administrateur",
        });
});

afterAll(async () => {
    await sequelize.close();
});

describe("PATCH /employee/:id/role", () => {
    test("Doit ajouter le rôle de l'employé", async () => {
        const response = await request(app)
            .patch("/api/employee/1/role")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
                roleId: 1,
                add: true,
            });

        expect(response.status).toBe(200);
        expect(response.body.executed).toBe(true);
    });

    test("Doit supprimer le rôle de l'employé", async () => {
        await EmployeService.updateEmployeRole(1, 1, true);

        const response = await request(app)
            .patch("/api/employee/1/role")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
                roleId: 1,
                add: false,
            });

        expect(response.status).toBe(200);
        expect(response.body.executed).toBe(true);
    });

    test("Doit retourner une erreur si l'employé n'existe pas", async () => {
        const response = await request(app)
            .patch("/api/employee/9999/role")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
                roleId: 1,
                add: true,
            });

        expect(response.status).toBe(404);
        expect(response.body.error).toBe(ErrorEnum.ACCOUNT_NOT_FOUND);
    });

    test("Doit retourner une erreur si le rôle n'existe pas", async () => {
        const response = await request(app)
            .patch("/api/employee/1/role")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
                roleId: 9999,
                add: true,
            });

        expect(response.status).toBe(404);
        expect(response.body.error).toBe(ErrorEnum.ROLE_NOT_FOUND);
    });

    test("Doit retourner un erreur si les champs requis sont manquants", async () => {
        const response = await request(app)
            .patch("/api/employee/1/role")
            .set("Authorization", `Bearer ${authToken}`)
            .send({});

        expect(response.status).toBe(400);
        expect(response.body.error).toBe(ErrorEnum.MISSING_REQUIRED_FIELDS);
    });

    test("Doit retourner un erreur si le type de la valeur 'add' est incorrect", async () => {
        const response = await request(app)
            .patch("/api/employee/1/role")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
                roleId: 1,
                add: "true",
            });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe(ErrorEnum.MISSING_REQUIRED_FIELDS);
    });

    test("Doit retourner 'FALSE' si il possède déjà le rôle", async () => {
        await request(app)
            .patch("/api/employee/1/role")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
                roleId: 1,
                add: true,
            });

        const response = await request(app)
            .patch("/api/employee/1/role")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
                roleId: 1,
                add: true,
            });

        expect(response.status).toBe(200);
        expect(response.body.executed).toBe(false);
    });

    test("Doit retourner 'FALSE' si on tente de supprimer un rôle qu'il ne possède pas", async () => {
        const response = await request(app)
            .patch("/api/employee/1/role")
            .set("Authorization", `Bearer ${authToken}`)
            .send({
                roleId: 1,
                add: false,
            });

        expect(response.status).toBe(200);
        expect(response.body.executed).toBe(false);
    });

    test("Doit demander l'authentification", async () => {
        const response = await request(app)
            .patch("/api/employee/1/role")
            .send({
                roleId: 1,
                add: true,
            });

        expect(response.status).toBe(401);
    });
});