import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const SECRET_KEY = process.env.JWT_SECRET || 'defaultsecret';

interface CustomRequest extends Request {
  token?: any;
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error("Token manquant");
    }

    // Tentative de vérification du token
    const decoded = jwt.verify(token, SECRET_KEY);
    (req as CustomRequest).token = decoded;

    next();
  } catch (err) {
    console.log("Erreur de vérification du JWT : ", err);
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).send('Signature invalide ou jeton incorrect');
    } else {
      res.status(401).send('Veuillez vous authentifier');
    }
  }
};
