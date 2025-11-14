// api/index.js - JavaScript para evitar problemas de compilação no Vercel
const serverless = require("serverless-http");
const app = require("../dist/app").default || require("../dist/app");

// Configura o serverless de forma simples e confiável
const handler = serverless(app, {
  binary: ['image/*', 'application/pdf']
});

module.exports = handler;

