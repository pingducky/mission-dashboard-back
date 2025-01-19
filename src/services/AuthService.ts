import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import AccountModel from '../models/AccountModel';

const SECRET_KEY = process.env.JWT_SECRET || 'defaultsecret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

class AuthService {
  // Fonction d'enregistrement d'un utilisateur
  public static async register(firstName: string, lastName: string, email: string, password: string, phoneNumber: string): Promise<string> {
    // Vérifier si l'email existe déjà
    const existingUser = await AccountModel.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('Email déjà utilisé');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer un nouvel utilisateur
    const newAccount = await AccountModel.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      isEnabled: true,
      phoneNumber: phoneNumber,
    });

    return AuthService.generateJwt(newAccount);
  }

  // Fonction de connexion d'un utilisateur
  public static async login(email: string, password: string): Promise<string> {
    // Chercher l'utilisateur par email
    const account = await AccountModel.findOne({ where: { email } });
    if (!account) {
      throw new Error('Compte non trouvé');
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      throw new Error('Mot de passe invalide');
    }

    return AuthService.generateJwt(account);
  }

  // Fonction pour générer un token JWT
  private static generateJwt(account: any): string {
    return jwt.sign({ id: account.id, email: account.email }, SECRET_KEY, {
      expiresIn: JWT_EXPIRES_IN
    });
  }

  // Fonction de vérification du token JWT
  public static verifyJwt(token: string): any {
    try {
      return jwt.verify(token, SECRET_KEY);
    } catch (error) {
      throw new Error('Token invalide');
    }
  }
}

export default AuthService;
