// api/index.js - JavaScript para evitar problemas de compilação no Vercel
const serverless = require("serverless-http");
const app = require("../dist/app").default || require("../dist/app");

// Wrapper para adicionar CORS em todas as respostas
const handler = async (event, context) => {
  const result = await serverless(app, {
    binary: ['image/*', 'application/pdf']
  })(event, context);
  
  // Adiciona headers CORS em TODAS as respostas
  const origin = event.headers?.origin || event.headers?.Origin || '*';
  result.headers = result.headers || {};
  result.headers['Access-Control-Allow-Origin'] = origin;
  result.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
  result.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
  result.headers['Access-Control-Max-Age'] = '86400';
  result.headers['Access-Control-Allow-Credentials'] = 'false';
  
  // Trata OPTIONS preflight diretamente
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: result.headers,
      body: ''
    };
  }
  
  return result;
};

module.exports = handler;

