// roleMiddleware.ts
import { Request, Response, NextFunction } from 'express';

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const usuario = (req as any).usuario;

    if (!usuario || !roles.includes(usuario.role)) {
      return res.status(403).json({ mensagem: 'Acesso negado. Permissão insuficiente.' });
    }

    next();
  };
};
