import AuthService from "../../services/AuthService";

// Fonction pour générer un token pour les tests
export const generateAuthTokenForTest = async (): Promise<string> => {
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

    return token;
};