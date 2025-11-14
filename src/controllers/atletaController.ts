import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function calcularIdade(dataNascimento: Date | string): number {
  const nascimento = new Date(dataNascimento);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--;
  return idade;
}

export const criarAtleta = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = req.usuario?.id;
    if (!usuarioId || typeof usuarioId !== "string") {
      res.status(401).json({ mensagem: "Usuário não autenticado" });
      return;
    }

    const { nome, categoria, dataNascimento, genero, fone } = req.body as {
      nome?: string;
      categoria?: string | null;
      dataNascimento?: string;
      genero?: string | null;
      fone?: string | null;
    };

    if (!nome || !dataNascimento) {
      res.status(400).json({ mensagem: "nome e dataNascimento são obrigatórios" });
      return;
    }

    const dataNasc = new Date(dataNascimento);

    const foto = ((req as any).file?.filename ?? null) as string | null;
    const fotoUrl = foto ? `${req.protocol}://${req.get("host")}/uploads/${foto}` : null;

    const novoAtleta = await prisma.atleta.create({
      data: {
        nome,
        dataNascimento: dataNasc,
        // Só envia campos opcionais se vierem (evita null em campos não-null)
        ...(categoria !== undefined && { categoria }),
        ...(genero !== undefined && { genero }),
        ...(fone !== undefined && { fone }),
        ...(fotoUrl !== null && { fotoUrl }),
        usuarioId, // UUID do usuário logado
      },
    });

    res.status(201).json(novoAtleta);
  } catch (error) {
    console.error("Erro ao criar atleta:", error);
    res.status(500).json({ mensagem: "Erro ao criar atleta" });
  }
};

export const listarAtletas = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuario = req.usuario;
    if (!usuario?.id) {
      res.status(401).json({ mensagem: "Usuário não autenticado" });
      return;
    }

    const atletas = await prisma.atleta.findMany({
      where: usuario.role === "ADMIN" ? {} : { usuarioId: usuario.id },
      include: {
        usuario: {
          select: { name: true, role: true },
        },
      },
      orderBy: { nome: "asc" },
    });

    // ✅ sem "implicit any": anota o tipo com base no próprio array
    const atletasComIdade = atletas.map((atleta: (typeof atletas)[number]) => ({
      ...atleta,
      idade: calcularIdade(atleta.dataNascimento),
    }));

    res.json({
      atletas: atletasComIdade,
      usuario: { id: usuario.id, role: usuario.role },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao listar atletas." });
  }
};

export const listarAtletasPaginados = async (req: Request, res: Response): Promise<void> => {
  try {
    const busca = (req.query.busca as string) || "";
    const pagina = parseInt(String(req.query.pagina ?? "1"), 10) || 1;
    const limite = parseInt(String(req.query.limite ?? "10"), 10) || 10;

    const atletas = await prisma.atleta.findMany({
      where: {
        nome: { contains: busca, mode: "insensitive" },
      },
      skip: (pagina - 1) * limite,
      take: limite,
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, dataNascimento: true },
    });

    const atletasComIdade = atletas.map((a: (typeof atletas)[number]) => ({
      ...a,
      idade: calcularIdade(a.dataNascimento),
    }));

    res.json(atletasComIdade);
  } catch (error) {
    console.error("Erro ao buscar atletas paginados", error);
    res.status(500).json({ error: "Erro ao buscar atletas" });
  }
};

export const atualizarAtleta = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, dataNascimento, genero, fone, categoria } = req.body as {
      nome?: string;
      dataNascimento?: string;
      genero?: string | null;
      fone?: string | null;
      categoria?: string | null;
    };
    const atletaId = req.params.id;

    const dataUpdate: {
      nome?: string;
      dataNascimento?: Date;
      genero?: string | null;
      fone?: string | null;
      categoria?: string | null;
    } = {};

    if (nome) dataUpdate.nome = nome;
    if (dataNascimento) dataUpdate.dataNascimento = new Date(dataNascimento);
    if (genero !== undefined) dataUpdate.genero = genero;
    if (fone !== undefined) dataUpdate.fone = fone;
    if (categoria !== undefined) dataUpdate.categoria = categoria;

    const atletaAtualizado = await prisma.atleta.update({
      where: { id: atletaId },
      data: dataUpdate,
    });

    res.json(atletaAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar atleta:", error);
    res.status(500).json({ mensagem: "Erro ao atualizar atleta." });
  }
};

export const alterarFotoAtleta = async (req: Request, res: Response): Promise<void> => {
  try {
    const atletaId = req.params.id;
    const novaFoto = (req as any).file?.filename;

    if (!novaFoto) {
      res.status(400).json({ mensagem: "Nenhuma foto foi enviada." });
      return;
    }

    const fotoUrl = `${req.protocol}://${req.get("host")}/uploads/${novaFoto}`;

    const atleta = await prisma.atleta.update({
      where: { id: atletaId },
      data: { fotoUrl },
    });

    res.status(200).json({ mensagem: "Foto atualizada com sucesso.", atleta });
  } catch (error) {
    console.error("Erro ao atualizar foto do atleta:", error);
    res.status(500).json({ mensagem: "Erro interno ao atualizar foto." });
  }
};

export const verificarAtletaUsuario = async (req: Request, res: Response): Promise<void> => {
  const started = Date.now();
  const reqId = Math.random().toString(36).slice(2, 10);

  // Não inspecione/recorte tokens. Apenas identifique o tipo do Authorization.
  const auth = req.headers.authorization || "";
  const authKind =
    auth.startsWith("Basic ") ? "Basic" :
    auth.startsWith("Bearer ") ? "Bearer" :
    "None";

  console.log(`[verificarAtletaUsuario][${reqId}] IN`, {
    ip: req.ip,
    method: req.method,
    path: req.originalUrl,
    ua: req.get("user-agent"),
    authKind,
  });

  try {
    const usuario = req.usuario; // requer augmentation de tipo (ver nota abaixo)

    if (!usuario?.id) {
      console.log(`[verificarAtletaUsuario][${reqId}] NO_AUTH`, { usuario: !!usuario });
      res.status(401).json({ mensagem: "Usuário não autenticado" });
      return;
    }

    console.log(`[verificarAtletaUsuario][${reqId}] LOOKUP`, { userId: usuario.id });

    const atleta = await prisma.atleta.findFirst({
      where: { usuarioId: usuario.id },
      select: { id: true, nome: true, categoria: true, genero: true, fone: true, dataNascimento: true, usuarioId: true },
    });

    if (!atleta) {
      console.log(`[verificarAtletaUsuario][${reqId}] NOT_FOUND`, { userId: usuario.id });
      res.status(204).send();
      return;
    }

    console.log(`[verificarAtletaUsuario][${reqId}] OK`, {
    atleta});

    res.status(200).json(atleta);
  } catch (error) {
    console.error(`[verificarAtletaUsuario][${reqId}] ERROR`, { err: (error as Error)?.message });
    res.status(500).json({ erro: "Erro ao buscar dados de atleta" });
  } finally {
    console.log(`[verificarAtletaUsuario][${reqId}] DONE`, { ms: Date.now() - started });
  }
};
