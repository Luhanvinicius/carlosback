import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import * as userService from '../services/userService';


export const create = async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;
    const user = await userService.createUser(name, email);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar usuário', details: error });
  }
};

export const list = async (_: Request, res: Response) => {
  const users = await userService.getAllUsers();
  res.json(users);
};


export const atualizarPerfil = async (req: Request, res: Response) => {
  const usuarioId = req.usuario?.id;
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
      process.env.JWT_SECRET!,
      { expiresIn: '1d' }
    );

    return res.json({ mensagem: 'Perfil atualizado com sucesso', token: novoToken });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: 'Erro ao atualizar perfil' });
  }
};

export const getUsuarioLogado = async (req: Request, res: Response) => {
  try {
    const usuarioId = req.usuario?.id;
    const usuario = await userService.getUsuarioById(usuarioId);

    if (!usuario) return res.status(404).json({ mensagem: 'Usuário não encontrado' });

    return res.json(usuario);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: 'Erro ao buscar usuário' });
  }
};
