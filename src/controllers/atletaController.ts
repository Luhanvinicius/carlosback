import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const criarAtleta = async (req: Request, res: Response) => {
  try {
    const { nome, idade, categoria, dataNascimento,genero, fone } = req.body;
    const usuarioId = (req as any).usuario.id;
    const foto = req.file?.filename;
 
    const dataNasc = new Date(dataNascimento);

    const novoAtleta = await prisma.atleta.create({
      data: {
        nome,
        dataNascimento: dataNasc,
        categoria,
        fone,
        fotoUrl: foto ? `${req.protocol}://${req.get('host')}/uploads/${foto}` : null,
        usuarioId,
      },
    });

    res.status(201).json(novoAtleta);
  } catch (error) {
    console.error('Erro ao criar atleta:', error);
    res.status(500).json({ mensagem: 'Erro ao criar atleta' });
  }
};

function calcularIdade(dataNascimento: Date): number {
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();

  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade;
}

export const listarAtletas = async (req: Request, res: Response) => {
  try {
    const usuario = (req as any).usuario;

    const atletas = await prisma.atleta.findMany({
      where: usuario.role === 'ADMIN' ? {} : { usuarioId: usuario.id },
      include: {
        usuario: {
          select: {
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        nome: 'asc',
      },
    });

    const atletasComIdade = atletas.map((atleta) => ({
      ...atleta,
      idade: calcularIdade(atleta.dataNascimento),
    }));

    return res.json({
      atletas: atletasComIdade,
      usuario: {
        id: usuario.id,
        role: usuario.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro ao listar atletas.' });
  }
};


export const listarAtletasPaginados = async (req: Request, res: Response) => {
  try {
    const busca = (req.query.busca as string) || '';
    const pagina = parseInt(req.query.pagina as string) || 1;
    const limite = parseInt(req.query.limite as string) || 10;

    const atletas = await prisma.atleta.findMany({
      where: {
        nome: {
          contains: busca,
          mode: 'insensitive',
        },
      },
      skip: (pagina - 1) * limite,
      take: limite,
      orderBy: {
        nome: 'asc',
      },
      select: {
        id: true,
        nome: true,
      },
    });

    res.json(atletas);
  } catch (error) {
    console.error('Erro ao buscar atletas paginados', error);
    res.status(500).json({ error: 'Erro ao buscar atletas' });
  }
};



// src/controllers/atletaController.ts
export const atualizarAtleta = async (req: Request, res: Response) => {
  const { nome, dataNascimento, genero, fone, categoria} = req.body;
  const atletaId = req.params.id;

  try {
    const dataNasc = dataNascimento ? new Date(dataNascimento) : undefined;

    const atletaAtualizado = await prisma.atleta.update({
      where: { id: atletaId },
      data: {
        ...(nome && { nome }),
        ...(genero && { genero }),
        ...(fone && { fone }),        
        ...(categoria && { categoria }),                
        ...(dataNasc && { dataNascimento: dataNasc }),
      },
    });

    res.json(atletaAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar atleta:', error);
    res.status(500).json({ mensagem: 'Erro ao atualizar atleta.' });
  }
};

export const alterarFotoAtleta = async (req: Request, res: Response) => {
  try {
    const atletaId = req.params.id;
    const novaFoto = req.file?.filename;

    if (!novaFoto) {
      return res.status(400).json({ mensagem: 'Nenhuma foto foi enviada.' });
    }

    const atleta = await prisma.atleta.update({
      where: { id: atletaId },
      data: {
        fotoUrl: `${req.protocol}://${req.get('host')}/uploads/${novaFoto}`,
      },
    });

    res.status(200).json({ mensagem: 'Foto atualizada com sucesso.', atleta });
  } catch (error) {
    console.error('Erro ao atualizar foto do atleta:', error);
    res.status(500).json({ mensagem: 'Erro interno ao atualizar foto.' });
  }
};

export const verificarAtletaUsuario = async (req: Request, res: Response) => {
 const usuario = (req as any).usuario

 console.log(usuario);

  try {
    const atleta = await prisma.atleta.findFirst({
      where: { usuarioId: usuario.id }
    });

    if (!atleta) return res.status(204).send(); // Ainda não criou perfil

    return res.status(200).json(atleta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro ao buscar dados de atleta' });
  }
};
