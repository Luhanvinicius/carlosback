import { RequestHandler } from "express";
import { query } from "../db";
import bcrypt from "bcryptjs";
// JWT removido - usando apenas BASIC auth

// Prisma removido - usando query direto
// JWT removido - usando apenas BASIC auth

function setNoStore(res: any) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Vary", "Authorization");
}

export const login: RequestHandler = async (req, res) => {
  try {
    const emailRaw = (req.body?.email ?? "") as string;
    const senha = (req.body?.password ?? req.body?.senha ?? "") as string;
    const email = emailRaw.trim().toLowerCase();

    if (!email || !senha) {
      res.status(400).json({ mensagem: "Informe email e senha." });
      return;
    }

    const result = await query('SELECT * FROM "User" WHERE email = $1', [email]);
    const usuarioDb = result.rows[0];
    if (!usuarioDb) {
      res.status(401).json({ mensagem: "Usuário não encontrado" });
      return;
    }

    const senhaHash = (usuarioDb as any).password ?? (usuarioDb as any).senhaHash ?? "";
    const ok = await bcrypt.compare(senha, senhaHash);
    if (!ok) {
      res.status(401).json({ mensagem: "Senha incorreta" });
      return;
    }

    const usuario = {
      id: usuarioDb.id,
      nome: (usuarioDb as any).name ?? (usuarioDb as any).nome ?? "",
      email: usuarioDb.email,
      role: (usuarioDb as any).role ?? "USER",
      atletaId:
        (usuarioDb as any).atletaId !== undefined ? (usuarioDb as any).atletaId : undefined,
    };

    setNoStore(res);

    // Retorna apenas o usuário (sem token JWT - usando apenas BASIC auth)
    res.json({ usuario });
    return;
  } catch (error) {
    console.error("login error:", error);
    res.status(500).json({ mensagem: "Erro ao efetuar login" });
    return;
  }
};
