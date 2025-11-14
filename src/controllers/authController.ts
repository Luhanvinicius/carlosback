// src/controllers/authController.ts
import type { RequestHandler } from "express";
import * as authService from "../services/authService";

export const register: RequestHandler = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const { user } = await authService.register(name, email, password, role);

    res.status(201).json({
      user, // { id, name, email, role } - sem token JWT
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message ?? "Erro ao registrar" });
  }
};

export const login: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user } = await authService.login(email, password);

    res.json({
      user, // { id, name, email, role } - sem token JWT
    });
  } catch (err: any) {
    res.status(401).json({ error: err.message ?? "Credenciais inválidas" });
  }
};

export const me: RequestHandler = async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    if (!usuario?.id) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }
    res.json(usuario); // { id, name, email, role }
  } catch {
    res.status(500).json({ error: "Erro ao obter usuário" });
  }
};
