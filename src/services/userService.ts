import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';


 const prisma = new PrismaClient();

/* export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
}); */

export const createUser = async (name: string, email: string) => {
  return await prisma.user.create({
    data: { name, email },
  });
};



export const getAllUsers = async () => {
  return await prisma.user.findMany();
};

export const atualizarUsuario = async (id: number, dados: { name?: string; password?: string }) => {
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

export const getUsuarioById = async (id: number) => {
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