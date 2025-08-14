import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'chave-super-secreta';


export const register = async (name: string, email: string, password: string, role: string = 'USER') => {
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: role.toUpperCase() as Role  }
  });
  return user;
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Usuário não encontrado');
 console.log(user);
  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error('Senha incorreta');

    const token = jwt.sign(
  { userId: user.id, role: user.role },
  JWT_SECRET,
  { expiresIn: '1h' }
);


  return { token, user: { id: user.id, name: user.name, email: user.email } };
};