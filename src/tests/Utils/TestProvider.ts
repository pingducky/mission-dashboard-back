import AccountModel from "../../models/AccountModel";
import AuthService from "../../services/AuthService";

let isTokenGenerated: boolean = false;
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

    isTokenGenerated = true;

    return token;
};


let supposedId: number = 0;
/**
 *  Generate a user for test purpose
 * @returns supposedId the supposed id of the user created
 */
export const generateUserForTest = async (isFirstInTest: boolean = false) : Promise<number> => {
    if(isFirstInTest) {
        supposedId = 0;
        if(isTokenGenerated) {
            supposedId++;
        }
    }

    supposedId++;
    const fakeUser = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe"+supposedId.toString()+"@example.com",
        password: "password123",
        phoneNumber: "1234567890",
    };

    // Appeler le service d'authentification pour créer un utilisateur
    await AuthService.register(
        fakeUser.firstName,
        fakeUser.lastName,
        fakeUser.email,
        fakeUser.password,
        fakeUser.phoneNumber
    );

    return supposedId;
};