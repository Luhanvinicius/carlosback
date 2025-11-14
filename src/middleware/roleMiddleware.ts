// src/middleware/roleMiddleware.ts
import { Request, Response, NextFunction, RequestHandler } from "express";

// Pode receber tanto string quanto enum do Prisma
export type Role = "ADMIN" | "USER" | string;

export const requireRole = (...roles: Role[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.usuario?.role;

    // Sem usuário (não autenticado)
    if (!role) {
      res.status(401).json({ mensagem: "Usuário não autenticado" });
      return;
    }

    // Normaliza para maiúsculas (aceita "admin", "ADMIN", etc.)
    const userRole = String(role).toUpperCase();
    const allowedRoles = roles.map(r => String(r).toUpperCase());

    // Sem permissão
    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({ mensagem: "Acesso negado. Permissão insuficiente." });
      return;
    }

    next();
  };
};

