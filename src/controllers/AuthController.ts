import { Request, Response } from 'express';
import AuthService from '../services/AuthService';
import AccountModel from '../models/AccountModel';

// Fonction d'enregistrement d'un utilisateur
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password, phoneNumber } = req.body;
    const token = await AuthService.register(firstName, lastName, email, password, phoneNumber);
    res.status(201).json({ token });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// Fonction de connexion d'un utilisateur
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const token = await AuthService.login(email, password);
    res.status(200).json({ token });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// Fonction pour obtenir un compte par ID
export const getAccountById = async (req: Request, res: Response): Promise<void> => {
  try {
    const accountId = parseInt(req.params.id, 10);
    const account = await AccountModel.findByPk(accountId);
    if (account) {
      res.status(200).json(account);
    } else {
      res.status(404).json({ error: 'Compte non trouvé' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Échec de récupération du compte' });
  }
};
