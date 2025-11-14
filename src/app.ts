// src/app.ts
import express, { Request, Response, NextFunction, RequestHandler } from "express";
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

// CORS - SEMPRE permitir todas as origens para funcionar no Vercel
// Middleware CORS DEVE ser o PRIMEIRO middleware
const corsMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  console.log(`[CORS App] ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  
  // SEMPRE permite a origem da requisição (ou qualquer origem)
  const origin = req.headers.origin || '*';
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("Access-Control-Allow-Credentials", "false");
  
  // Responde preflight OPTIONS imediatamente
  if (req.method === "OPTIONS") {
    console.log("[CORS App] OPTIONS preflight - respondendo 204");
    res.status(204).end();
    return;
  }
  
  next();
};

app.use(corsMiddleware);

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
