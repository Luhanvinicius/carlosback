import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createCanvas, loadImage, registerFont } from 'canvas';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const prisma = new PrismaClient();

// Registra a fonte, se necessário
registerFont(path.join(__dirname, '../assets/fonts/OpenSans-Bold.ttf'), { family: 'Open Sans' });

export const criarPartida = async (req: Request, res: Response) => {
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

    // Verificar existência dos atletas obrigatórios
    if (!atleta1Id || !atleta2Id) {
      return res.status(400).json({ error: 'Atleta1Id e Atleta2Id são obrigatórios' });
    }

    const atletasIds = [atleta1Id, atleta2Id, atleta3Id, atleta4Id].filter(Boolean);
    for (const id of atletasIds) {
      const atleta = await prisma.atleta.findUnique({ where: { id } });
      if (!atleta) {
        return res.status(400).json({ error: `Atleta com id ${id} não encontrado` });
      }
    }

    if (torneioId) {
      const torneio = await prisma.torneio.findUnique({ where: { id: torneioId } });
      if (!torneio) {
        return res.status(400).json({ error: `Torneio com id ${torneioId} não encontrado` });
      }
    }

    const novaPartida = await prisma.partida.create({
      data: {
        data: new Date(data),
        local,
        atleta1Id,
        atleta2Id,
        atleta3Id: atleta3Id || null,
        atleta4Id: atleta4Id || null,
        gamesTime1,
        gamesTime2,
        tiebreakTime1,
        tiebreakTime2,
        supertiebreakTime1,
        supertiebreakTime2,
        torneioId: torneioId || null,
      },
    });

    res.status(201).json(novaPartida);
  } catch (error) {
    console.error('Erro ao criar partida:', error);
    res.status(500).json({ error: 'Erro ao criar partida' });
  }
};


export const listarPartidas = async (req: Request, res: Response) => {
  try {
    const partidas = await prisma.partida.findMany({
      include: {
        atleta1: true,
        atleta2: true,
        atleta3: true,        
        atleta4: true,        
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(partidas);
  } catch (error) {
    console.error('Erro ao listar partidas:', error);
    res.status(500).json({ error: 'Erro ao buscar partidas' });
  }
};

export const atualizarPlacar = async (req: Request, res: Response) => {
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

    const parseOrNull = (v: any) => (v === '' || v === null || v === undefined ? null : (Number.isFinite(Number(v)) ? Number(v) : null));
    const isInt = (n: number | null) => n !== null && Number.isInteger(n);
    const isFilled = (n: number | null) => n !== null;

    gamesTime1 = parseOrNull(gamesTime1);
    gamesTime2 = parseOrNull(gamesTime2);
    tiebreakTime1 = parseOrNull(tiebreakTime1);
    tiebreakTime2 = parseOrNull(tiebreakTime2);
    supertiebreakTime1 = parseOrNull(supertiebreakTime1);
    supertiebreakTime2 = parseOrNull(supertiebreakTime2);

    // obrigatórios e não-negativos
    if (!isInt(gamesTime1) || !isInt(gamesTime2) || gamesTime1! < 0 || gamesTime2! < 0) {
      return res.status(400).json({ error: 'Placar de games é obrigatório, inteiro e não negativo' });
    }

    // este endpoint não aceita supertiebreak
    if (isFilled(supertiebreakTime1) || isFilled(supertiebreakTime2)) {
      return res.status(400).json({ error: 'Supertiebreak não é permitido neste formato' });
    }

    const g1 = gamesTime1!, g2 = gamesTime2!;
    const vencedor = Math.max(g1, g2);
    const perdedor = Math.min(g1, g2);
    const diff = vencedor - perdedor;

    // NUNCA persistimos 6–6; se houve tiebreak, o games final tem que ser 7–6/6–7
    if (g1 === 6 && g2 === 6) {
      return res.status(400).json({ error: 'Resultado final não pode ser 6x6. Use 7x6/6x7 com tiebreak informado.' });
    }

    const tiebreakInformado = isFilled(tiebreakTime1) && isFilled(tiebreakTime2);

    if (tiebreakInformado) {
      // Com tiebreak: só aceitamos 7–6 ou 6–7
      const eSetComTB = (g1 === 7 && g2 === 6) || (g1 === 6 && g2 === 7);
      if (!eSetComTB) {
        return res.status(400).json({ error: 'Com tiebreak informado, o placar de games deve ser 7x6 ou 6x7.' });
      }
      const tb1 = tiebreakTime1!, tb2 = tiebreakTime2!;
      const tbMaior = Math.max(tb1, tb2);
      const tbDiff = Math.abs(tb1 - tb2);
      if (!Number.isInteger(tb1) || !Number.isInteger(tb2) || tb1 < 0 || tb2 < 0) {
        return res.status(400).json({ error: 'Tiebreak deve ser inteiro e não negativo.' });
      }
      if (tbMaior < 7 || tbDiff < 2) {
        return res.status(400).json({ error: 'Tiebreak inválido: mínimo 7 pontos e 2 de diferença.' });
      }
    } else {
      // Sem tiebreak: válidos são 6–0..6–4 (dif ≥2) ou 7–5
      if (vencedor === 6) {
        if (diff < 2) return res.status(400).json({ error: 'Com 6 games, é preciso 2 de diferença (6–0..6–4).' });
      } else if (vencedor === 7) {
        const validoSeteCinco = (g1 === 7 && g2 === 5) || (g2 === 7 && g1 === 5);
        if (!validoSeteCinco) {
          return res.status(400).json({ error: 'Sem tiebreak, somente 7–5 é válido quando há 7 games.' });
        }
      } else {
        return res.status(400).json({ error: 'Placar inválido: máximo é 7 (sem TB), ou 7–6/6–7 com tiebreak.' });
      }
    }

    const partidaAtualizada = await prisma.partida.update({
      where: { id },
      data: {
        gamesTime1: g1,
        gamesTime2: g2,
        tiebreakTime1: tiebreakInformado ? tiebreakTime1 : null,
        tiebreakTime2: tiebreakInformado ? tiebreakTime2 : null,
        supertiebreakTime1: null,
        supertiebreakTime2: null,
      },
    });

    return res.json(partidaAtualizada);
  } catch (error) {
    console.error('Erro ao atualizar placar:', error);
    return res.status(500).json({ error: 'Erro ao atualizar placar' });
  }
};

export const gerarCardPartida = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const partida = await prisma.partida.findUnique({
      where: { id },
      include: {
        atleta1: true,
        atleta2: true,
        atleta3: true,
        atleta4: true,
      },
    });

    if (!partida) {
      return res.status(404).json({ error: 'Partida não encontrada' });
    }

    const largura = 1080;
    const altura = 1920;
    const canvas = createCanvas(largura, altura);
    const ctx = canvas.getContext('2d');

    // Fundo base
    const background = await loadImage(path.join(__dirname, '../assets/templates/card_base.png'));
    ctx.drawImage(background, 0, 0, largura, altura);

    const carregarImagemRemota = async (url?: string) => {
      if (!url) return null;
      try {
        const res = await axios.get(url, { responseType: 'arraybuffer' });
        return await loadImage(Buffer.from(res.data, 'binary'));
      } catch {
        return null;
      }
    };

    const imgPadrao = await loadImage(path.join(__dirname, '../assets/avatar.png'));

    const atletas = [
      partida.atleta1,
      partida.atleta2,
      partida.atleta3,
      partida.atleta4,
    ];

    const imagens = await Promise.all(
      atletas.map(async (a) => (await carregarImagemRemota(a?.fotoUrl)) || imgPadrao)
    );

    // Fotos
    const tamanho = 220;
    const posicoesFotos = [
      [70, 380],
      [70, 680],
      [770, 380],
      [770, 680],
    ];

    imagens.forEach((img, i) => {
      ctx.drawImage(img, posicoesFotos[i][0], posicoesFotos[i][1], tamanho, tamanho);
    });

    // Textos
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'left';

    ctx.fillText(`${partida.atleta1.nome}`, 100, 400);
    ctx.fillText(`${partida.atleta2.nome}`, 100, 670);
    ctx.fillText(`${partida.atleta3.nome}`, 770, 400);
    ctx.fillText(`${partida.atleta4.nome}`, 770, 670);

    // Info principal
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Jogo Amistoso', 800, 100);

    const data = new Date(partida.data);
    const dia = data.toLocaleDateString('pt-BR');
    const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    ctx.font = 'bold 42px Arial';
    ctx.fillText(`${dia} - ${hora}`, 800, 150);

    ctx.font = 'bold 36px Arial';
    ctx.fillText(`${partida.local}`, 800, 200);

    // 🔥 Últimos confrontos
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Últimos Confrontos', 500, 950);

    const confrontos = await buscarUltimosConfrontosFormatados(partida.id);

    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    confrontos.forEach((linha, i) => {
      ctx.fillText(linha, 500, 1000 + i * 30);
    });

    // Exporta imagem
    const buffer = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);

  } catch (error) {
    console.error('Erro ao gerar card da partida:', error);
    res.status(500).json({ error: 'Erro ao gerar card da partida' });
  }
};


export async function buscarUltimosConfrontosFormatados(partidaId: string) {
  const partidaAtual = await prisma.partida.findUnique({
    where: { id: partidaId },
    select: {
      id: true,
      data: true,
      atleta1Id: true,
      atleta2Id: true,
      atleta3Id: true,
      atleta4Id: true,
    },
  });

  if (!partidaAtual) return [];

  const { data, atleta1Id, atleta2Id, atleta3Id, atleta4Id } = partidaAtual;

  const confrontos = await prisma.partida.findMany({
    where: {
      id: { not: partidaId },
      data: { lt: data },
      OR: [
        {
          AND: [
            { atleta1Id },
            { atleta2Id },
            { atleta3Id },
            { atleta4Id },
          ],
        },
        {
          AND: [
            { atleta1Id: atleta3Id },
            { atleta2Id: atleta4Id },
            { atleta3Id: atleta1Id },
            { atleta4Id: atleta2Id },
          ],
        },
      ],
    },
    orderBy: { data: "desc" },
    take: 3,
    include: {
      atleta1: true,
      atleta2: true,
      atleta3: true,
      atleta4: true,
    },
  });

  return confrontos.map((c) => {
    const dataFormatada = format(c.data, "dd/MM - HH:mm", { locale: ptBR });

    const time1Nome = `${c.atleta1?.nome ?? "—"} e ${c.atleta2?.nome ?? "—"}`;
    const time2Nome = `${c.atleta3?.nome ?? "—"} e ${c.atleta4?.nome ?? "—"}`;

    const vencedor =
      c.gamesTime1 === c.gamesTime2
        ? time1Nome // desempate pelo tiebreak (assume time1)
        : c.gamesTime1! > c.gamesTime2!
        ? time1Nome
        : time2Nome;

    const placarBase = `${c.gamesTime1}x${c.gamesTime2}`;
    const tiebreak =
      c.gamesTime1 === 6 &&
      c.gamesTime2 === 6 &&
      c.tiebreakTime1 != null &&
      c.tiebreakTime2 != null
        ? ` (${c.tiebreakTime1}x${c.tiebreakTime2})`
        : "";

    return `${dataFormatada} - ${vencedor} (${placarBase}${tiebreak})`;
  });
}
