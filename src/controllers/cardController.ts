// src/controllers/cardController.ts
import path from "path";
import axios from "axios";
import { Request, Response } from "express";
import { createCanvas, loadImage, registerFont } from "canvas";
import { buscarUltimosConfrontosFormatados } from "../services/cardService";
import { query } from "../db";

const WIDTH = 1080;
const HEIGHT = 1920;
const AVATAR_SIZE = 220;

// helper de assets estável (aponta para src/assets/* mesmo após build)
const asset = (...p: string[]) => path.resolve(process.cwd(), "src", "assets", ...p);

// Fonte registrada (use o mesmo helper de asset)
registerFont(asset("fonts", "OpenSans-Bold.ttf"), { family: "Open Sans" });

// Cache leve para imagens base (evita re-carregar a cada request)
let baseImages: { background?: any; avatar?: any } = {};
async function getBaseImages() {
  if (!baseImages.background) {
    baseImages.background = await loadImage(asset("templates", "card_base.png"));
  }
  if (!baseImages.avatar) {
    baseImages.avatar = await loadImage(asset("avatar.png"));
  }
  return baseImages;
}

/** -------- Helpers de desenho/texto/data/imagem remota -------- */

// desenha imagem recortada em círculo
function drawCircleImage(
  ctx: any, // CanvasRenderingContext2D (usar any para não exigir lib dom no tsconfig)
  img: any, // CanvasImageSource
  x: number,
  y: number,
  size: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, x, y, size, size);
  ctx.restore();
}

// reduz a fonte até caber na largura informada (respeita ctx.font atual)
function fitText(ctx: any, text: string, maxWidth: number) {
  let fontSize = parseInt(ctx.font.match(/\d+/)?.[0] || "28", 10);
  while (fontSize >= 14) {
    const metric = ctx.measureText(text);
    if (metric.width <= maxWidth) return; // coube
    fontSize -= 2;
    ctx.font = ctx.font.replace(/\d+px/, `${fontSize}px`);
  }
}

// quebra de linha simples (máximo de linhas)
function wrapText(
  ctx: any,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 2
) {
  const words = (text || "").toString().split(/\s+/);
  let line = "";
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const test = line ? line + " " + words[n] : words[n];
    const width = ctx.measureText(test).width;
    if (width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n];
      y += lineHeight;
      lineCount++;
      if (lineCount >= maxLines - 1) break;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, y);
}

// baixa imagem remota com validações básicas
async function loadImageRemote(url?: string | null) {
  if (!url) return null;
  try {
    const resp = await axios.get<ArrayBuffer>(url, {
      responseType: "arraybuffer",
      timeout: 6000,
      maxContentLength: 5 * 1024 * 1024, // 5MB
      validateStatus: (s) => s >= 200 && s < 400,
    });
    const ct = String(resp.headers["content-type"] || "");
    if (!/image\/(png|jpe?g|webp)/i.test(ct)) return null;
    return await loadImage(Buffer.from(resp.data));
  } catch {
    return null;
  }
}

// data/hora no fuso de São Paulo
function formatarDataHoraBR(isoDate: string | Date) {
  const d = new Date(isoDate);
  const tz = "America/Sao_Paulo";
  const dia = new Intl.DateTimeFormat("pt-BR", { timeZone: tz }).format(d);
  const hora = new Intl.DateTimeFormat("pt-BR", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  return { dia, hora };
}

/** ---------------- Controller principal ---------------- */

export const gerarCardPartida = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT p.*, 
       a1.nome as "atleta1Nome", a2.nome as "atleta2Nome",
       a3.nome as "atleta3Nome", a4.nome as "atleta4Nome"
       FROM "Partida" p
       LEFT JOIN "Atleta" a1 ON p."atleta1Id" = a1.id
       LEFT JOIN "Atleta" a2 ON p."atleta2Id" = a2.id
       LEFT JOIN "Atleta" a3 ON p."atleta3Id" = a3.id
       LEFT JOIN "Atleta" a4 ON p."atleta4Id" = a4.id
       WHERE p.id = $1`,
      [id]
    );
    const partida = result.rows[0] ? {
      ...result.rows[0],
      atleta1: result.rows[0].atleta1Nome ? { nome: result.rows[0].atleta1Nome } : null,
      atleta2: result.rows[0].atleta2Nome ? { nome: result.rows[0].atleta2Nome } : null,
      atleta3: result.rows[0].atleta3Nome ? { nome: result.rows[0].atleta3Nome } : null,
      atleta4: result.rows[0].atleta4Nome ? { nome: result.rows[0].atleta4Nome } : null,
    } : null;
    if (!partida) {
       res.status(404).json({ error: "Partida não encontrada" });
      return       
    }

    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");

    // fundo base (com cache)
    const { background, avatar } = await getBaseImages();
    ctx.drawImage(background, 0, 0, WIDTH, HEIGHT);

    // fotos (remotas com fallback para avatar)
    const atletas = [partida.atleta1, partida.atleta2, partida.atleta3, partida.atleta4];
    const imagens = await Promise.all(
      atletas.map(async (a) => (await loadImageRemote(a?.fotoUrl)) || avatar)
    );

    const posicoesFotos: Array<[number, number]> = [
      [70, 380],
      [70, 680],
      [WIDTH - 70 - AVATAR_SIZE, 380],
      [WIDTH - 70 - AVATAR_SIZE, 680],
    ];
    imagens.forEach((img, i) => {
      const [x, y] = posicoesFotos[i];
      drawCircleImage(ctx, img, x, y, AVATAR_SIZE);
    });

    // textos
    ctx.fillStyle = "#fff";

    // nomes (com ajuste de largura)
    const nomes = [
      partida.atleta1?.nome || "—",
      partida.atleta2?.nome || "—",
      partida.atleta3?.nome || "—",
      partida.atleta4?.nome || "—",
    ];
    const posicoesNomes: Array<[number, number, CanvasTextAlign]> = [
      [100, 640, "left"],
      [100, 940, "left"],
      [WIDTH - 100, 640, "right"],
      [WIDTH - 100, 940, "right"],
    ];
    nomes.forEach((nome, i) => {
      const [x, y, align] = posicoesNomes[i];
      ctx.textAlign = align;
      ctx.font = '36px "Open Sans"';
      fitText(ctx, nome, 420);
      ctx.fillText(nome, x, y);
    });

    // título
    ctx.textAlign = "center";
    ctx.font = 'bold 44px "Open Sans"';
    ctx.fillText(partida?.torneioId ? "Jogo de Torneio" : "Jogo Amistoso", WIDTH / 2, 160);

    // data / local
    const { dia, hora } = formatarDataHoraBR(partida.data);
    ctx.font = 'bold 42px "Open Sans"';
    ctx.fillText(`${dia} • ${hora}`, WIDTH / 2, 220);

    ctx.font = 'bold 34px "Open Sans"';
    wrapText(ctx, partida.local || "Local a confirmar", WIDTH / 2, 270, 800, 38, 2);

    // últimos confrontos
    const confrontos = await buscarUltimosConfrontosFormatados(partida.id).catch(() => []);
    ctx.font = 'bold 36px "Open Sans"';
    ctx.fillText("Últimos Confrontos", WIDTH / 2, 980);

    ctx.font = '30px "Open Sans"';
    (confrontos || []).slice(0, 5).forEach((linha, i) => {
      ctx.fillText(linha, WIDTH / 2, 1030 + i * 36);
    });

    // saída PNG (ou salve em storage e retorne URL)
    const buffer = canvas.toBuffer("image/png", { compressionLevel: 9 });
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=60");
    res.send(buffer);
  } catch (error) {
    console.error("Erro ao gerar card da partida:", error);
    res.status(500).json({ error: "Erro ao gerar card da partida" });
  }
};
