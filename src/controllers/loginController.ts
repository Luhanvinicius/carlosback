import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const AUTH_MODE = (process.env.AUTH_MODE || "JWT").toUpperCase();

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

    const usuarioDb = await prisma.user.findUnique({ where: { email } });
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

    if (AUTH_MODE === "BASIC") {
      res.json({ token: "basic-mode", usuario });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ mensagem: "JWT_SECRET não configurado no servidor" });
      return;
    }

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role, atletaId: usuario.atletaId ?? undefined },
      secret,
      { expiresIn: "1h" }
    );

    res.json({ token, usuario });
    return;
  } catch (error) {
    console.error("login error:", error);
    res.status(500).json({ mensagem: "Erro ao efetuar login" });
    return;
  }
};
