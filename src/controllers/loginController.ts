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
    console.log("Login attempt:", { email: req.body?.email, hasPassword: !!req.body?.password });
    
    const emailRaw = (req.body?.email ?? "") as string;
    const senha = (req.body?.password ?? req.body?.senha ?? "") as string;
    const email = emailRaw.trim().toLowerCase();

    if (!email || !senha) {
      console.log("Missing email or password");
      res.status(400).json({ mensagem: "Informe email e senha." });
      return;
    }

    console.log("Querying user with email:", email);
    const result = await query('SELECT * FROM "User" WHERE email = $1', [email]);
    console.log("Query result rows:", result.rows.length);
    
    const usuarioDb = result.rows[0];
    if (!usuarioDb) {
      console.log("User not found for email:", email);
      res.status(401).json({ mensagem: "Usuário não encontrado" });
      return;
    }

    const senhaHash = (usuarioDb as any).password ?? (usuarioDb as any).senhaHash ?? "";
    if (!senhaHash) {
      console.error("User has no password hash:", usuarioDb);
      res.status(500).json({ mensagem: "Erro na configuração do usuário" });
      return;
    }

    console.log("Comparing password...");
    const ok = await bcrypt.compare(senha, senhaHash);
    if (!ok) {
      console.log("Password mismatch for email:", email);
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

    console.log("Login successful for user:", usuario.email);
    setNoStore(res);

    // Retorna apenas o usuário (sem token JWT - usando apenas BASIC auth)
    // Compatibilidade: retorna tanto 'usuario' quanto 'user' para garantir funcionamento
    res.json({ 
      usuario,
      user: usuario  // Alias para compatibilidade com frontend
    });
    return;
  } catch (error: any) {
    console.error("login error:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      code: error?.code
    });
    res.status(500).json({ 
      mensagem: "Erro ao efetuar login",
      error: error?.message || "Erro desconhecido"
    });
    return;
  }
};
