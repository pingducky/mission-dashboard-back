import { Request, Response } from 'express';
import AccountModel from '../models/AccountModel';

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