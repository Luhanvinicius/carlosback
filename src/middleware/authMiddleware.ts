import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Espera "Bearer <token>"

    if (!token) {
      res.status(401).json({ mensagem: 'Token não fornecido' });
      return;
    }

    jwt.verify(token, JWT_SECRET, (err, payload) => {
      if (err) {
        res.status(403).json({ mensagem: 'Token inválido ou expirado' });
        return;
      }

      // Adiciona o usuário decodificado na request
      (req as any).usuario = payload;
         next();
    });
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro no middleware de autenticação' });
  }
};
function jwt_decode(token: string | undefined): any {
  throw new Error('Function not implemented.');
}

