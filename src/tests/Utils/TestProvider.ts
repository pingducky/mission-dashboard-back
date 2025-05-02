import { permissionsEnum } from "../../enums/permissionsEnum";
import { roleEnum } from "../../enums/roleEnum";
import AccountModel from "../../models/AccountModel";
import AccountRoleModel from "../../models/AccountRoleModel";
import PermissionModel from "../../models/PermissionModel";
import PermissionRoleModel from "../../models/PermissionRoleModel";
import RoleModel from "../../models/RoleModel";
import AuthService from "../../services/AuthService";

// Fonction pour générer un token pour les tests
export const generateAuthTokenForTest = async (): Promise<string> => {
    await AccountModel.destroy({ where: {}, force: true });

    const fakeUser = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        password: "password123",
        phoneNumber: "1234567890",
    };

    // Appeler le service d'authentification pour créer un utilisateur
    const token = await AuthService.register(
        fakeUser.firstName,
        fakeUser.lastName,
        fakeUser.email,
        fakeUser.password,
        fakeUser.phoneNumber
    );
    console.debug("token : ", token)
    return token;
};

export const initRoles = async (): Promise<void> => {
    const permissions = Object.values(permissionsEnum);
    for (const permission of permissions) {
        await PermissionModel.create({
            shortLibel: permission.substring(0, 10),
            longLibel: permission,
        });
    }

    const roles = Object.values(roleEnum);
    for (const role of roles) {
        await RoleModel.create({
            shortLibel: role.substring(0, 10),
            longLibel: role,
        });
    }
};

export const giveAdminRole = async (): Promise<void> => {
    await AccountRoleModel.create({
        idAccount: 1,
        idRole: 1,
    });

    const permissions = await PermissionModel.findAll();
    for (const permission of permissions) {
        await PermissionRoleModel.create({
            idPermission: permission.id,
            idRole: 1,
        });
    }
};

export const setupPermission = async (permission: permissionsEnum[]): Promise<void> => {
    //TO DO possibilité d'attribuer des permissions à l'utilisateur de test créé en premier
};

export const setupRole = async (roles: roleEnum[]): Promise<void> => {
    //TO DO possibilité d'attribuer des roles à l'utilisateur de test créé en premier
}