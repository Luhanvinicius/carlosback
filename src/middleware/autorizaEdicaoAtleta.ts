import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const autorizaEdicaoAtleta = async (req: Request, res: Response, next: NextFunction) => {
  const usuario = (req as any).usuario;
  const atletaId = req.params.id;

  try {
    console.log(atletaId);
    console.log(usuario);

    const atleta = await prisma.atleta.findUnique({
      where: { id: atletaId },
    });

    if (!atleta) {
      res.status(404).json({ mensagem: 'Atleta não encontrado.' });
      return;
    }

    // Se não for admin, só pode editar se for dono do atleta
    if (usuario.role !== 'ADMIN' && atleta.usuarioId !== usuario.id) {
      res.status(403).json({ mensagem: 'Acesso negado.' });
      return;
    }

    next();
  } catch (error) {
    console.error('Erro no middleware de autorização:', error);
    res.status(500).json({ mensagem: 'Erro interno.' });
    return;
  }
};
