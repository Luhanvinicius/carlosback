// src/app.ts
import express, { Request, Response, NextFunction } from "express";
// CORS removido - usando middleware manual

import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
import atletaRoutes from "./routes/atletaRoutes";
import partidaRoutes from "./routes/partidaRoutes";
import cardRoutes from "./routes/cardRoutes";
import healthRoutes from "./routes/healthRoutes";

// >>> ADIÇÃO: middleware de auth comutável (JWT/BASIC)
import { authMiddleware } from "./middleware/auth";

const app = express();

// (opcional, se estiver atrás de proxy/CDN)
app.set("trust proxy", true);

// CORS (ajuste para seus domínios)
const origins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// habilita CORS global — precisa vir ANTES das rotas
// Se CORS_ORIGIN for "*", permite qualquer origem
const corsOrigin = origins.length && origins[0] === "*" ? true : origins.length ? origins : true;

// Middleware CORS manual - SEMPRE permite todas as origens para funcionar no Vercel
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // SEMPRE permite a origem da requisição (ou qualquer origem se não tiver)
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("Access-Control-Allow-Credentials", "false");
  
  // Responde preflight imediatamente SEM processar a requisição
  if (req.method === "OPTIONS") {
    console.log("OPTIONS preflight request - respondendo 204");
    return res.status(204).end();
  }
  
  next();
});

app.use(express.json());

// Em provedores com FS somente leitura, use storage externo para uploads.
// Local ok:
app.use("/uploads", express.static("uploads"));

// >>> ADIÇÃO: middleware para evitar cache em rotas privadas
function noStore(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Vary", "Authorization");
  next();
}

// ---------- Rotas públicas ----------
app.use("/auth", authRoutes);
app.use("/health", healthRoutes);

// ---------- Rotas privadas (protegidas por auth + no-store) ----------
app.use("/user", authMiddleware(), noStore, userRoutes);
app.use("/atleta", authMiddleware(), noStore, atletaRoutes);
app.use("/partida", authMiddleware(), noStore, partidaRoutes);
app.use("/card", authMiddleware(), noStore, cardRoutes);

// Rota raiz
app.get("/", (_req: Request, res: Response): void => {
  res.send("API Online 🚀");
});

// 404
app.use((_req: Request, res: Response): void => {
  res.status(404).json({ mensagem: "Rota não encontrada aqui" });
});

// Handler de erro global
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  console.error(err);
  res.status(500).json({ mensagem: "Erro interno do servidor" });
});

export default app;
