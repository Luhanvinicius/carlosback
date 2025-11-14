// api/index.js - JavaScript para evitar problemas de compilação no Vercel
const serverless = require("serverless-http");
const app = require("../dist/app").default || require("../dist/app");

// Função auxiliar para obter origem da requisição
function getOrigin(headers) {
  return headers?.origin || headers?.Origin || headers?.['x-forwarded-origin'] || '*';
}

// Função auxiliar para obter método HTTP
function getMethod(event) {
  return event.httpMethod || event.request?.method || event.method || 'GET';
}

// Headers CORS base
function getCorsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin === '*' ? '*' : origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };
}

// Wrapper para adicionar CORS em todas as respostas
const handler = async (event, context) => {
  const origin = getOrigin(event.headers);
  const method = getMethod(event);
  
  console.log(`[Handler] ${method} ${event.path || event.url || '/'} - Origin: ${origin}`);
  
  const corsHeaders = getCorsHeaders(origin);
  
  // Trata OPTIONS preflight ANTES de chamar serverless-http
  if (method === 'OPTIONS' || method === 'options') {
    console.log('[CORS Handler] OPTIONS preflight - respondendo 204');
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }
  
  // Processa requisições normais com serverless-http
  try {
    const result = await serverless(app, {
      binary: ['image/*', 'application/pdf'],
      request: (req, event) => {
        // Preserva informações da requisição original
        if (event.path) req.url = event.path;
        if (event.queryStringParameters) {
          const query = new URLSearchParams(event.queryStringParameters).toString();
          if (query) req.url += `?${query}`;
        }
      }
    })(event, context);
    
    console.log('[Handler] Result status:', result?.statusCode);
    
    // Garante que os headers CORS estejam em TODAS as respostas
    const finalHeaders = {
      ...corsHeaders,
      ...(result?.headers || {})
    };
    
    // Garante que os headers não sejam undefined
    return {
      statusCode: result?.statusCode || 200,
      headers: finalHeaders,
      body: result?.body || ''
    };
  } catch (error) {
    console.error('[ERROR] Handler error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};

module.exports = handler;

