// src/middlewares/auth.ts
import { Request, Response, NextFunction, RequestHandler } from "express";
import bcrypt from "bcryptjs";
import { query } from "../db";

// Tipo User
type User = {
  id: string;
  email: string;
  name: string;
  password: string;
  role: string;
  atletaId?: string | null;
};

function setNoStore(res: Response) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Vary", "Authorization");
}

// ---------- BASIC ----------
const authBasic: RequestHandler = async (req, res, next) => {
  const h = req.headers.authorization;
  if (!h?.startsWith("Basic ")) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Restricted"');
    res.status(401).json({ mensagem: "Basic auth requerido" });
    return;
  }

  try {
    const base64 = h.slice("Basic ".length);
    const decoded = Buffer.from(base64, "base64").toString("utf8");

    const idx = decoded.indexOf(":");
    const emailRaw = idx >= 0 ? decoded.slice(0, idx) : decoded;
    const senha = idx >= 0 ? decoded.slice(idx + 1) : "";

    const email = emailRaw.trim().toLowerCase();
    if (!email || !senha) {
      res.status(401).json({ mensagem: "Credenciais inválidas" });
      return;
    }

    const result = await query("SELECT * FROM \"User\" WHERE email = $1", [email]);
    const user = result.rows[0] as User | undefined;
    if (!user) {
      res.status(401).json({ mensagem: "Usuário/senha inválidos" });
      return;
    }

    const hash = (user as any).password ?? (user as any).senhaHash ?? "";
    const ok = await bcrypt.compare(senha, hash);
    if (!ok) {
      res.status(401).json({ mensagem: "Usuário/senha inválidos" });
      return;
    }

    (req as any).usuario = shapeUsuario(user);
    setNoStore(res);
    next();
  } catch (e) {
    console.error("authBasic error:", e);
    res.status(401).json({ mensagem: "Não autorizado" });
  }
};

// ---------- Seleciona modo ----------
export function authMiddleware(): RequestHandler {
  // Usa apenas BASIC auth (JWT removido)
  return authBasic;
}

// ---------- Helper ----------
function shapeUsuario(user: User) {
  const nome = (user as any).name ?? (user as any).nome ?? "";
  const role = (user as any).role ?? "USER";
  const atletaId =
    (user as any).atletaId !== undefined ? (user as any).atletaId : undefined;

  return { id: user.id, nome, role, atletaId };
}
