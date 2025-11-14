// src/types/express.d.ts
import "express";

declare module "express-serve-static-core" {
  interface Request {
    usuario?: {
      id: string;
      name?: string;
      email?: string;
      role?: string;
      atletaId?: string | null;
      // adicione aqui o que você coloca no JWT
    };
  }
}
