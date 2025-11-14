// src/controllers/userController.ts
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import * as userService from "../services/userService";

// cria usuário (mantive assinatura do seu service)
export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password} = req.body;
    const user = await userService.createUser(name, email,password);
    res.status(201).json(user);
    return;
  } catch (error) {
    res.status(400).json({ error: "Erro ao criar usuário", details: error });
    return;
  }
};

export const list = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar usuários" });
  }
};

export const atualizarPerfil = async (req: Request, res: Response): Promise<void> => {
  const usuarioId = req.usuario?.id; // UUID (string)

  if (!usuarioId || typeof usuarioId !== "string") {
    res.status(401).json({ mensagem: "Usuário não autenticado" });
    return;
  }

  const { name, password } = req.body;

  try {
    const usuario = await userService.atualizarUsuario(usuarioId, { name, password });

    const novoToken = jwt.sign(
      {
        id: usuario.id,
        name: usuario.name,
        email: usuario.email,
        role: usuario.role,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    res.json({ mensagem: "Perfil atualizado com sucesso", token: novoToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: "Erro ao atualizar perfil" });
  }
};

export const getUsuarioLogado = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = req.usuario?.id;

    if (!usuarioId || typeof usuarioId !== "string") {
      res.status(401).json({ mensagem: "Usuário não autenticado" });
      return;
    }

    const usuario = await userService.getUsuarioById(usuarioId);

    if (!usuario) {
      res.status(404).json({ mensagem: "Usuário não encontrado" });
      return;
    }

    res.json(usuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: "Erro ao buscar usuário" });
  }
};
