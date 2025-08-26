// src/app.ts
import express from "express";
import cors from "cors";

// IMPORTS DAS SUAS ROTAS (ajuste os caminhos conforme seu projeto)
import partidaRoutes from "./routes/partidaRoutes";
import cardRoutes from "./routes/cardRoutes"; // se estiver usando proxy de cards no vercel

// CORS: defina CORS_ORIGIN no .env (separado por vírgula)
const origins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const app = express();
app.use(cors({ origin: origins.length ? origins : true }));
app.use(express.json());

// MONTE AS ROTAS
app.use(partidaRoutes);
app.use(cardRoutes); // remova se não for usar no vercel

// Healthcheck
// app.get("/healthz", (_req, res) => res.json({ ok: true }));

export default app;
