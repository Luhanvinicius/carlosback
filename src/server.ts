// src/server.ts
import "dotenv/config";
import app from "./app";

const port = Number(process.env.PORT) || 3000;

// Em provedores, logue sem "localhost", porque geralmente é porta dinâmica:
app.listen(port, "0.0.0.0", () => {
  console.log(`✅ API rodando na porta ${port}`);
});
