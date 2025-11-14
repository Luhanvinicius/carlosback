import { Request, Response } from "express";
import { query } from "../db";
import { v4 as uuidv4 } from "uuid";

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

    const id = uuidv4();
    await query(
      'INSERT INTO "Atleta" (id, nome, "dataNascimento", categoria, genero, fone, "fotoUrl", "usuarioId", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())',
      [id, nome, dataNasc, categoria || null, genero || null, fone || null, fotoUrl, usuarioId]
    );
    const result = await query('SELECT * FROM "Atleta" WHERE id = $1', [id]);
    const novoAtleta = result.rows[0];

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

    const whereClause = usuario.role === "ADMIN" ? '' : `WHERE "usuarioId" = '${usuario.id}'`;
    const result = await query(
      `SELECT a.*, u.name as "usuarioName", u.role as "usuarioRole" 
       FROM "Atleta" a 
       LEFT JOIN "User" u ON a."usuarioId" = u.id 
       ${whereClause}
       ORDER BY a.nome ASC`,
      []
    );
    const atletas = result.rows.map((row: any) => ({
      ...row,
      usuario: row.usuarioName ? { name: row.usuarioName, role: row.usuarioRole } : null
    }));

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

    const offset = (pagina - 1) * limite;
    const result = await query(
      `SELECT id, nome, "dataNascimento" 
       FROM "Atleta" 
       WHERE nome ILIKE $1 
       ORDER BY nome ASC 
       LIMIT $2 OFFSET $3`,
      [`%${busca}%`, limite, offset]
    );
    const atletas = result.rows;

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

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (dataUpdate.nome) {
      updates.push(`nome = $${paramIndex++}`);
      values.push(dataUpdate.nome);
    }
    if (dataUpdate.dataNascimento) {
      updates.push(`"dataNascimento" = $${paramIndex++}`);
      values.push(dataUpdate.dataNascimento);
    }
    if (dataUpdate.genero !== undefined) {
      updates.push(`genero = $${paramIndex++}`);
      values.push(dataUpdate.genero);
    }
    if (dataUpdate.fone !== undefined) {
      updates.push(`fone = $${paramIndex++}`);
      values.push(dataUpdate.fone);
    }
    if (dataUpdate.categoria !== undefined) {
      updates.push(`categoria = $${paramIndex++}`);
      values.push(dataUpdate.categoria);
    }
    
    if (updates.length > 0) {
      values.push(atletaId);
      await query(
        `UPDATE "Atleta" SET ${updates.join(', ')}, "updatedAt" = NOW() WHERE id = $${paramIndex}`,
        values
      );
    }
    
    const result = await query('SELECT * FROM "Atleta" WHERE id = $1', [atletaId]);
    const atletaAtualizado = result.rows[0];

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

    await query('UPDATE "Atleta" SET "fotoUrl" = $1, "updatedAt" = NOW() WHERE id = $2', [fotoUrl, atletaId]);
    const result = await query('SELECT * FROM "Atleta" WHERE id = $1', [atletaId]);
    const atleta = result.rows[0];

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

    const result = await query(
      'SELECT id, nome, categoria, genero, fone, "dataNascimento", "usuarioId" FROM "Atleta" WHERE "usuarioId" = $1 LIMIT 1',
      [usuario.id]
    );
    const atleta = result.rows[0] || null;

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
