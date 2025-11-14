// api/index.js - JavaScript para evitar problemas de compilação no Vercel
const serverless = require("serverless-http");
const app = require("../dist/app").default || require("../dist/app");

// Configura o serverless com opções que preservam headers CORS
const handler = serverless(app, {
  binary: ['image/*', 'application/pdf'],
  request(request, event, context) {
    // Preserva headers originais
    request.url = event.path || request.url;
    request.method = event.httpMethod || request.method;
  },
  response(response, event, context) {
    // Garante que headers CORS sejam preservados
    response.headers = response.headers || {};
    
    // Adiciona headers CORS se não estiverem presentes
    if (!response.headers['Access-Control-Allow-Origin']) {
      const origin = event.headers?.origin || event.headers?.Origin || '*';
      response.headers['Access-Control-Allow-Origin'] = origin;
      response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
      response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
      response.headers['Access-Control-Max-Age'] = '86400';
    }
  }
});

module.exports = handler;

