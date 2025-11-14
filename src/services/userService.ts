import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';


 const prisma = new PrismaClient();

export const createUser = async (
  name: string,
  email: string,
  password: string
) => {
  if (!name || !email || !password) {
    throw new Error("name, email e password são obrigatórios");
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    throw new Error("E-mail já cadastrado");
  }

  const hash = await bcrypt.hash(password, 12);

  return prisma.user.create({
    data: { name, email, password: hash },
    // nunca retorne o password
    select: { id: true, name: true, email: true, role: true },
  });
};


export const getAllUsers = async () => {
  return await prisma.user.findMany();
};

export const atualizarUsuario = async (id: string, dados: { name?: string; password?: string }) => {
  const dadosAtualizados: any = {};

  if (dados.name) dadosAtualizados.name = dados.name;
  if (dados.password) {
    dadosAtualizados.password = await bcrypt.hash(dados.password, 10);
  }

  return prisma.user.update({
    where: { id: id },
    data: dadosAtualizados,
  });
};

export const getUsuarioById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
};