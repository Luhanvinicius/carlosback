// src/middleware/authMiddleware.ts
import type { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { VerifyErrors, JwtPayload } from "jsonwebtoken";
import { query } from "../db";

const AUTH_MODE = (process.env.AUTH_MODE || "JWT").toUpperCase();
const JWT_SECRET = process.env.JWT_SECRET;

function setNoStore(res: Response) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Vary", "Authorization");
}

// ---------- BASIC ----------
const authBasic: RequestHandler = async (req, res, next) => {
  const h = req.headers.authorization ?? (req.headers as any).Authorization;
  if (!h?.startsWith("Basic ")) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Restricted"');
    res.status(401).json({ mensagem: "Basic auth requerido" });
    return;
  }

  try {
    const base64 = h.slice("Basic ".length);
    const decoded = Buffer.from(base64, "base64").toString("utf8");

    // dividir apenas no primeiro ':'
    const idx = decoded.indexOf(":");
    const emailRaw = idx >= 0 ? decoded.slice(0, idx) : decoded;
    const senha = idx >= 0 ? decoded.slice(idx + 1) : "";

    const email = emailRaw.trim().toLowerCase();
    if (!email || !senha) {
      res.status(401).json({ mensagem: "Credenciais inválidas" });
      return;
    }

    const result = await query('SELECT * FROM "User" WHERE email = $1', [email]);
    const user = result.rows[0];
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

    (req as any).usuario = {
      id: String(user.id),
      name: (user as any).name ?? (user as any).nome ?? "",
      email: user.email ?? "",
      role: (user as any).role ?? "USER",
      atletaId:
        (user as any).atletaId !== undefined ? (user as any).atletaId : undefined,
    };

    setNoStore(res);
    next();
  } catch (e) {
    console.error("[authBasic] error:", e);
    res.status(401).json({ mensagem: "Não autorizado" });
  }
};

// ---------- JWT ----------

const authJwt: RequestHandler = (req, res, next) => {
  const rawHeader = req.headers.authorization ?? (req.headers as any).Authorization;
  const token = rawHeader?.startsWith("Bearer ") ? rawHeader.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ mensagem: "Token não fornecido" });
    return;
  }
  if (!JWT_SECRET) {
    console.warn("[authMiddleware] JWT_SECRET não definido!");
    res.status(500).json({ mensagem: "Configuração inválida do servidor (JWT_SECRET ausente)" });
    return;
  }

  jwt.verify(
    token,
    JWT_SECRET,
    (err: VerifyErrors | null, decoded: JwtPayload | string | undefined) => {
      if (err || !decoded) {
        res.status(403).json({ mensagem: "Token inválido ou expirado" });
        return;
      }

      const payload = typeof decoded === "string" ? {} : decoded;

      const rawId = (payload as any).id ?? (payload as any).userId;
      const id = rawId != null ? String(rawId) : undefined;
      if (!id) {
        res.status(401).json({ mensagem: "Token sem id de usuário" });
        return;
      }

      (req as any).usuario = {
        id,
        name: (payload as any).name ?? "",
        email: (payload as any).email ?? "",
        role: (payload as any).role ?? "USER",
        atletaId: (payload as any).atletaId ?? undefined,
      };

      setNoStore(res);
      next();
    }
  );
};

// ---------- Export (comutável) ----------
export const authenticateToken: RequestHandler =
  AUTH_MODE === "BASIC" ? authBasic : authJwt;
