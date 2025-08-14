import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response) => {
    try {
  const { email, password } = req.body;
   const usuario = await prisma.user.findUnique({ where: { email } });
  if (!usuario) return res.status(401).json({ mensagem: 'Usuário não encontrado' });

  const senhaCorreta = await bcrypt.compare(password, usuario.password);
  if (!senhaCorreta) return res.status(401).json({ mensagem: 'Senha incorreta' });

const token = jwt.sign(
  {
    id: usuario.id,
    name: usuario.name,
    email: usuario.email,
    role: usuario.role,
  },
  process.env.JWT_SECRET!,
  { expiresIn: '1h' }
);

  res.json({token, usuario: { id: usuario.id, nome: usuario.name, email: usuario.email } });
    } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
