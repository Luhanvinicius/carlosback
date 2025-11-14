// src/controllers/partidaController.ts
import { Request, Response } from "express";
import { query } from "../db";
import { v4 as uuidv4 } from "uuid";
import { createCanvas, loadImage, registerFont } from "canvas";
import axios from "axios";
import path from "path";
import fs from "fs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Registra a fonte (ajuste o caminho se necessário)
registerFont(path.join(__dirname, "../assets/fonts/OpenSans-Bold.ttf"), {
  family: "Open Sans",
});

export const criarPartida = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      data,
      local,
      atleta1Id,
      atleta2Id,
      atleta3Id,
      atleta4Id,
      gamesTime1,
      gamesTime2,
      tiebreakTime1,
      tiebreakTime2,
      supertiebreakTime1,
      supertiebreakTime2,
      torneioId,
    } = req.body;

    if (!atleta1Id || !atleta2Id) {
      res.status(400).json({ error: "Atleta1Id e Atleta2Id são obrigatórios" });
      return;
    }

    const atletasIds = [atleta1Id, atleta2Id, atleta3Id, atleta4Id].filter(Boolean) as string[];
    for (const id of atletasIds) {
      const result = await query('SELECT id FROM "Atleta" WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        res.status(400).json({ error: `Atleta com id ${id} não encontrado` });
        return;
      }
    }

    if (torneioId) {
      const result = await query('SELECT id FROM "Torneio" WHERE id = $1', [torneioId]);
      if (result.rows.length === 0) {
        res.status(400).json({ error: `Torneio com id ${torneioId} não encontrado` });
        return;
      }
    }

    const partidaId = uuidv4();
    await query(
      `INSERT INTO "Partida" (id, data, local, "atleta1Id", "atleta2Id", "atleta3Id", "atleta4Id", "gamesTime1", "gamesTime2", "tiebreakTime1", "tiebreakTime2", "supertiebreakTime1", "supertiebreakTime2", "torneioId", "createdAt") 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())`,
      [partidaId, new Date(data), local, atleta1Id, atleta2Id, atleta3Id || null, atleta4Id || null,
       gamesTime1 || null, gamesTime2 || null, tiebreakTime1 || null, tiebreakTime2 || null,
       supertiebreakTime1 || null, supertiebreakTime2 || null, torneioId || null]
    );
    const result = await query('SELECT * FROM "Partida" WHERE id = $1', [partidaId]);
    const novaPartida = result.rows[0];

    res.status(201).json(novaPartida);
  } catch (error) {
    console.error("Erro ao criar partida:", error);
    res.status(500).json({ error: "Erro ao criar partida" });
  }
};

export const listarPartidas = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT p.*, 
       a1.nome as "atleta1Nome", a1.id as "atleta1Id", 
       a2.nome as "atleta2Nome", a2.id as "atleta2Id",
       a3.nome as "atleta3Nome", a3.id as "atleta3Id", 
       a4.nome as "atleta4Nome", a4.id as "atleta4Id"
       FROM "Partida" p
       LEFT JOIN "Atleta" a1 ON p."atleta1Id" = a1.id
       LEFT JOIN "Atleta" a2 ON p."atleta2Id" = a2.id
       LEFT JOIN "Atleta" a3 ON p."atleta3Id" = a3.id
       LEFT JOIN "Atleta" a4 ON p."atleta4Id" = a4.id
       ORDER BY p."createdAt" DESC`,
      []
    );
    const partidas = result.rows.map((row: any) => ({
      ...row,
      atleta1: row.atleta1Nome ? { id: row.atleta1Id, nome: row.atleta1Nome } : null,
      atleta2: row.atleta2Nome ? { id: row.atleta2Id, nome: row.atleta2Nome } : null,
      atleta3: row.atleta3Nome ? { id: row.atleta3Id, nome: row.atleta3Nome } : null,
      atleta4: row.atleta4Nome ? { id: row.atleta4Id, nome: row.atleta4Nome } : null,
    }));

    res.json(partidas);
  } catch (error) {
    console.error("Erro ao listar partidas:", error);
    res.status(500).json({ error: "Erro ao buscar partidas" });
  }
};

export const atualizarPlacar = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    let {
      gamesTime1,
      gamesTime2,
      tiebreakTime1,
      tiebreakTime2,
      supertiebreakTime1,
      supertiebreakTime2,
    } = req.body;

    const parseOrNull = (v: unknown) =>
      v === "" || v === null || v === undefined
        ? null
        : Number.isFinite(Number(v))
        ? Number(v)
        : null;

    const isInt = (n: number | null) => n !== null && Number.isInteger(n);
    const isFilled = (n: number | null) => n !== null;

    gamesTime1 = parseOrNull(gamesTime1);
    gamesTime2 = parseOrNull(gamesTime2);
    tiebreakTime1 = parseOrNull(tiebreakTime1);
    tiebreakTime2 = parseOrNull(tiebreakTime2);
    supertiebreakTime1 = parseOrNull(supertiebreakTime1);
    supertiebreakTime2 = parseOrNull(supertiebreakTime2);

    // obrigatórios e não-negativos
    if (!isInt(gamesTime1) || !isInt(gamesTime2) || (gamesTime1 as number) < 0 || (gamesTime2 as number) < 0) {
      res.status(400).json({ error: "Placar de games é obrigatório, inteiro e não negativo" });
      return;
    }

    // este endpoint não aceita supertiebreak
    if (isFilled(supertiebreakTime1) || isFilled(supertiebreakTime2)) {
      res.status(400).json({ error: "Supertiebreak não é permitido neste formato" });
      return;
    }

    const g1 = gamesTime1 as number;
    const g2 = gamesTime2 as number;
    const vencedor = Math.max(g1, g2);
    const perdedor = Math.min(g1, g2);
    const diff = vencedor - perdedor;

    // nunca 6–6 como final
    if (g1 === 6 && g2 === 6) {
      res
        .status(400)
        .json({ error: "Resultado final não pode ser 6x6. Use 7x6/6x7 com tiebreak informado." });
      return;
    }

    const tiebreakInformado = isFilled(tiebreakTime1) && isFilled(tiebreakTime2);

    if (tiebreakInformado) {
      // com tiebreak: só 7–6 ou 6–7
      const eSetComTB = (g1 === 7 && g2 === 6) || (g1 === 6 && g2 === 7);
      if (!eSetComTB) {
        res
          .status(400)
          .json({ error: "Com tiebreak informado, o placar de games deve ser 7x6 ou 6x7." });
        return;
      }
      const tb1 = tiebreakTime1 as number;
      const tb2 = tiebreakTime2 as number;
      const tbMaior = Math.max(tb1, tb2);
      const tbDiff = Math.abs(tb1 - tb2);
      if (!Number.isInteger(tb1) || !Number.isInteger(tb2) || tb1 < 0 || tb2 < 0) {
        res.status(400).json({ error: "Tiebreak deve ser inteiro e não negativo." });
        return;
      }
      if (tbMaior < 7 || tbDiff < 2) {
        res.status(400).json({ error: "Tiebreak inválido: mínimo 7 pontos e 2 de diferença." });
        return;
      }
    } else {
      // sem tiebreak: 6–0..6–4 (dif ≥2) ou 7–5
      if (vencedor === 6) {
        if (diff < 2) {
          res.status(400).json({ error: "Com 6 games, é preciso 2 de diferença (6–0..6–4)." });
          return;
        }
      } else if (vencedor === 7) {
        const validoSeteCinco = (g1 === 7 && g2 === 5) || (g2 === 7 && g1 === 5);
        if (!validoSeteCinco) {
          res
            .status(400)
            .json({ error: "Sem tiebreak, somente 7–5 é válido quando há 7 games." });
          return;
        }
      } else {
        res
          .status(400)
          .json({ error: "Placar inválido: máximo é 7 (sem TB), ou 7–6/6–7 com tiebreak." });
        return;
      }
    }

    await query(
      `UPDATE "Partida" SET "gamesTime1" = $1, "gamesTime2" = $2, "tiebreakTime1" = $3, "tiebreakTime2" = $4, "supertiebreakTime1" = NULL, "supertiebreakTime2" = NULL, "updatedAt" = NOW() WHERE id = $5`,
      [g1, g2, tiebreakInformado ? (tiebreakTime1 as number) : null, tiebreakInformado ? (tiebreakTime2 as number) : null, id]
    );
    const result = await query('SELECT * FROM "Partida" WHERE id = $1', [id]);
    const partidaAtualizada = result.rows[0];

    res.json(partidaAtualizada);
  } catch (error) {
    console.error("Erro ao atualizar placar:", error);
    res.status(500).json({ error: "Erro ao atualizar placar" });
  }
};

export const gerarCardPartida = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT p.*, 
       a1.nome as "atleta1Nome", a1.id as "atleta1Id", a1."fotoUrl" as "atleta1Foto",
       a2.nome as "atleta2Nome", a2.id as "atleta2Id", a2."fotoUrl" as "atleta2Foto",
       a3.nome as "atleta3Nome", a3.id as "atleta3Id", a3."fotoUrl" as "atleta3Foto",
       a4.nome as "atleta4Nome", a4.id as "atleta4Id", a4."fotoUrl" as "atleta4Foto"
       FROM "Partida" p
       LEFT JOIN "Atleta" a1 ON p."atleta1Id" = a1.id
       LEFT JOIN "Atleta" a2 ON p."atleta2Id" = a2.id
       LEFT JOIN "Atleta" a3 ON p."atleta3Id" = a3.id
       LEFT JOIN "Atleta" a4 ON p."atleta4Id" = a4.id
       WHERE p.id = $1`,
      [id]
    );
    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ error: "Partida não encontrada" });
      return;
    }
    const partida = {
      ...row,
      atleta1: row.atleta1Nome ? { id: row.atleta1Id, nome: row.atleta1Nome, fotoUrl: row.atleta1Foto } : null,
      atleta2: row.atleta2Nome ? { id: row.atleta2Id, nome: row.atleta2Nome, fotoUrl: row.atleta2Foto } : null,
      atleta3: row.atleta3Nome ? { id: row.atleta3Id, nome: row.atleta3Nome, fotoUrl: row.atleta3Foto } : null,
      atleta4: row.atleta4Nome ? { id: row.atleta4Id, nome: row.atleta4Nome, fotoUrl: row.atleta4Foto } : null,
    };

    const largura = 1080;
    const altura = 1920;
    const canvas = createCanvas(largura, altura);
    const ctx = canvas.getContext("2d");

    // Fundo base
    const background = await loadImage(
      path.join(__dirname, "../assets/templates/card_base.png")
    );
    ctx.drawImage(background, 0, 0, largura, altura);

    const carregarImagemRemota = async (url?: string | null) => {
      if (!url) return null;
      try {
        const resImg = await axios.get(url, { responseType: "arraybuffer" });
        return await loadImage(Buffer.from(resImg.data, "binary"));
      } catch {
        return null;
      }
    };

    const imgPadrao = await loadImage(path.join(__dirname, "../assets/avatar.png"));

    const atletas = [partida.atleta1, partida.atleta2, partida.atleta3, partida.atleta4];

    const imagens = await Promise.all(
      atletas.map(async (a: (typeof atletas)[number]) => (await carregarImagemRemota(a?.fotoUrl)) ?? imgPadrao)
    );

    // Fotos
    const tamanho = 220;
    const posicoesFotos: Array<[number, number]> = [
      [70, 380],
      [70, 680],
      [770, 380],
      [770, 680],
    ];

    imagens.forEach((img, i) => {
      ctx.drawImage(img, posicoesFotos[i][0], posicoesFotos[i][1], tamanho, tamanho);
    });

    // Textos
    ctx.fillStyle = "#fff";
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "left";

    ctx.fillText(partida.atleta1?.nome ?? "A Definir", 100, 400);
    ctx.fillText(partida.atleta2?.nome ?? "A Definir", 100, 670);
    ctx.fillText(partida.atleta3?.nome ?? "A Definir", 770, 400);
    ctx.fillText(partida.atleta4?.nome ?? "A Definir", 770, 670);

    // Info principal
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Jogo Amistoso", 800, 100);

    const dataJogo = new Date(partida.data);
    const dia = dataJogo.toLocaleDateString("pt-BR");
    const hora = dataJogo.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    ctx.font = "bold 42px Arial";
    ctx.fillText(`${dia} - ${hora}`, 800, 150);

    ctx.font = "bold 36px Arial";
    ctx.fillText(`${partida.local}`, 800, 200);

    // Últimos confrontos
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Últimos Confrontos", 500, 950);

    const confrontos = await buscarUltimosConfrontosFormatados(partida.id);

    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    confrontos.forEach((linha, i) => {
      ctx.fillText(linha, 500, 1000 + i * 30);
    });

    // Exporta imagem
    const buffer = canvas.toBuffer("image/png");
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (error) {
    console.error("Erro ao gerar card da partida:", error);
    res.status(500).json({ error: "Erro ao gerar card da partida" });
  }
};

// ---- Últimos confrontos (sem Prisma.PartidaGetPayload) ----

export async function buscarUltimosConfrontosFormatados(partidaId: string): Promise<string[]> {
  // Pega a partida base (somente IDs e data)
  const result = await query(
    'SELECT data, "atleta1Id", "atleta2Id", "atleta3Id", "atleta4Id" FROM "Partida" WHERE id = $1',
    [partidaId]
  );
  const partidaAtual = result.rows[0];

  if (!partidaAtual) return [];

  const { data, atleta1Id, atleta2Id, atleta3Id, atleta4Id } = partidaAtual;

  // Simplificar busca - buscar partidas anteriores com os mesmos atletas
  const atletasIds = [atleta1Id, atleta2Id, atleta3Id, atleta4Id].filter((id): id is string => typeof id === "string");
  const confrontosResult = await query(
    `SELECT p.*, 
     a1.nome as "atleta1Nome", a2.nome as "atleta2Nome",
     a3.nome as "atleta3Nome", a4.nome as "atleta4Nome"
     FROM "Partida" p
     LEFT JOIN "Atleta" a1 ON p."atleta1Id" = a1.id
     LEFT JOIN "Atleta" a2 ON p."atleta2Id" = a2.id
     LEFT JOIN "Atleta" a3 ON p."atleta3Id" = a3.id
     LEFT JOIN "Atleta" a4 ON p."atleta4Id" = a4.id
     WHERE p.id != $1 AND p.data < $2
     AND (p."atleta1Id" = ANY($3::uuid[]) OR p."atleta2Id" = ANY($3::uuid[]))
     ORDER BY p.data DESC
     LIMIT 3`,
    [partidaId, data, atletasIds]
  );
  const confrontos = confrontosResult.rows.map((row: any) => ({
    ...row,
    atleta1: row.atleta1Nome ? { nome: row.atleta1Nome } : null,
    atleta2: row.atleta2Nome ? { nome: row.atleta2Nome } : null,
    atleta3: row.atleta3Nome ? { nome: row.atleta3Nome } : null,
    atleta4: row.atleta4Nome ? { nome: row.atleta4Nome } : null,
  }));

  return confrontos.map((c: (typeof confrontos)[number]) => {
    const dataFormatada = format(c.data, "dd/MM - HH:mm", { locale: ptBR });

    const time1Nome = `${c.atleta1?.nome ?? "—"} e ${c.atleta2?.nome ?? "—"}`;
    const time2Nome = `${c.atleta3?.nome ?? "—"} e ${c.atleta4?.nome ?? "—"}`;

    const g1 = c.gamesTime1 ?? 0;
    const g2 = c.gamesTime2 ?? 0;

    const vencedor = g1 === g2 ? time1Nome : g1 > g2 ? time1Nome : time2Nome;

    const placarBase = `${g1}x${g2}`;
    const tiebreak =
      (g1 === 6 && g2 === 6 && c.tiebreakTime1 != null && c.tiebreakTime2 != null) ||
      (g1 === 7 && g2 === 6 && c.tiebreakTime1 != null && c.tiebreakTime2 != null) ||
      (g1 === 6 && g2 === 7 && c.tiebreakTime1 != null && c.tiebreakTime2 != null)
        ? ` (${c.tiebreakTime1}x${c.tiebreakTime2})`
        : "";

    return `${dataFormatada} - ${vencedor} (${placarBase}${tiebreak})`;
  });
}
