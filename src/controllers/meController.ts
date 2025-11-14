// src/controllers/meController.ts
import { RequestHandler } from "express";

function setNoStore(res: any) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Vary", "Authorization");
}

export const me: RequestHandler = async (req, res) => {
  const usuario = (req as any).usuario;
  if (!usuario) {
    res.status(401).json({ mensagem: "Não autenticado" });
    return;
  }
  setNoStore(res);
  res.json({ usuario });
  return;
};
