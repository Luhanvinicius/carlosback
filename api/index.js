// api/index.js - JavaScript para evitar problemas de compilação no Vercel
const serverless = require("serverless-http");
const app = require("../dist/app").default || require("../dist/app");

// Wrapper para adicionar CORS em todas as respostas
const handler = async (event, context) => {
  console.log(`[Handler] ${event.httpMethod} ${event.path} - Origin: ${event.headers?.origin || event.headers?.Origin || 'none'}`);
  
  // Pega a origem da requisição (prioriza origin, depois Origin, depois *)
  const origin = event.headers?.origin || event.headers?.Origin || '*';
  
  // Headers CORS base - SEMPRE adicionar
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };
  
  // Trata OPTIONS preflight ANTES de chamar serverless-http
  if (event.httpMethod === 'OPTIONS') {
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
      binary: ['image/*', 'application/pdf']
    })(event, context);
    
    console.log('[Handler] Result status:', result.statusCode);
    
    // Garante que os headers CORS estejam em TODAS as respostas
    // Mescla os headers existentes com os headers CORS
    const finalHeaders = {
      ...corsHeaders,
      ...(result.headers || {})
    };
    
    return {
      ...result,
      headers: finalHeaders
    };
  } catch (error) {
    console.error('[ERROR] Handler error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

module.exports = handler;

