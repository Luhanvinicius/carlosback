"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const port = Number(process.env.PORT) || 3000;
// Em provedores, logue sem "localhost", porque geralmente é porta dinâmica:
app_1.default.listen(port, "0.0.0.0", () => {
    console.log(`✅ API rodando na porta ${port}`);
});
