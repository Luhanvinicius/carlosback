// api/index.js - JavaScript para evitar problemas de compilação no Vercel
const serverless = require("serverless-http");
const app = require("../dist/app").default || require("../dist/app");

// Headers CORS - SEMPRE permitir todas as origens
function getCorsHeaders(origin) {
  // SEMPRE retorna '*' para permitir qualquer origem
  const allowOrigin = origin || '*';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };
}

// Wrapper para adicionar CORS em TODAS as respostas
const handler = async (event, context) => {
  // Pega origem da requisição (prioriza várias fontes)
  const origin = event.headers?.origin 
    || event.headers?.Origin 
    || event.headers?.['x-forwarded-origin']
    || event.headers?.['X-Forwarded-Origin']
    || '*';
  
  const method = event.httpMethod || event.request?.method || event.method || 'GET';
  const path = event.path || event.url || '/';
  
  console.log(`[Handler] ${method} ${path} - Origin: ${origin}`);
  
  // Headers CORS que SERÃO adicionados em TODAS as respostas
  const corsHeaders = getCorsHeaders(origin);
  
  // Trata OPTIONS preflight ANTES de tudo
  if (method === 'OPTIONS' || method === 'options') {
    console.log('[CORS] OPTIONS preflight detectado - retornando 204');
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }
  
  // Processa requisições normais
  try {
    const result = await serverless(app, {
      binary: ['image/*', 'application/pdf']
    })(event, context);
    
    console.log(`[Handler] Resultado: status=${result?.statusCode}, headers=${JSON.stringify(Object.keys(result?.headers || {}))}`);
    
    // CRÍTICO: Garante que os headers CORS sejam SEMPRE adicionados
    // Mescla headers CORS com headers do resultado (CORS tem prioridade)
    const existingHeaders = result?.headers || {};
    const finalHeaders = {
      ...existingHeaders,
      ...corsHeaders  // CORS sobrescreve qualquer header existente
    };
    
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

