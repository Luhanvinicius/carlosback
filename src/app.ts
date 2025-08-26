// src/app.ts
import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
import atletaRoutes from "./routes/atletaRoutes";
import partidaRoutes from "./routes/partidaRoutes";
import cardRoutes from "./routes/cardRoutes";
import healthRoutes from "./routes/healthRoutes";

const app = express();

// CORS (ajuste para seus domínios)
const origins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(cors({ origin: origins.length ? origins : true }));

app.use(express.json());

// ⚠️ Atenção: em Vercel o FS é só leitura. Esta linha só funciona para
// servir arquivos que já foram empacotados no build, não para uploads dinâmicos.
// Para produção, prefira S3/R2/B2. Em dev local pode manter.
app.use("/uploads", express.static("uploads"));

// Rotas (em produção ficarão em /api/<prefixo>)
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/atleta", atletaRoutes);
app.use("/partida", partidaRoutes);
app.use("/card", cardRoutes);
app.use("/health", healthRoutes);

// Rota raiz
app.get("/", (_req, res) => res.send("API Online 🚀"));

// 404
app.use((_req, res) => res.status(404).json({ mensagem: "Rota não encontrada aqui" }));

export default app;
