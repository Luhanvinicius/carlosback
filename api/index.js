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
  // Log detalhado do evento recebido para debug
  console.log('[Handler] Event received:', JSON.stringify({
    httpMethod: event.httpMethod,
    path: event.path,
    url: event.url,
    method: event.method,
    req: event.req ? { method: event.req.method, url: event.req.url } : null,
    headers: event.headers ? Object.keys(event.headers) : null,
    body: typeof event.body === 'string' ? event.body.substring(0, 100) : event.body
  }, null, 2));
  
  // Pega origem da requisição (prioriza várias fontes)
  const origin = event.headers?.origin 
    || event.headers?.Origin 
    || event.headers?.['x-forwarded-origin']
    || event.headers?.['X-Forwarded-Origin']
    || '*';
  
  // Vercel usa diferentes formatos - tenta vários
  // Vercel Serverless Functions usam req/res diretamente
  let method = 'GET';
  let path = '/';
  
  // Tenta detectar o formato do Vercel
  if (event.req && event.req.method) {
    // Formato Vercel direto (req/res)
    method = event.req.method;
    path = event.req.url || '/';
  } else if (event.httpMethod) {
    // Formato AWS Lambda
    method = event.httpMethod;
    path = event.path || event.url || '/';
  } else if (event.method) {
    // Formato alternativo
    method = event.method;
    path = event.path || event.url || '/';
  } else if (event.request && event.request.method) {
    // Formato Cloudflare
    method = event.request.method;
    path = event.request.url || '/';
  }
  
  console.log(`[Handler] Detected: method=${method}, path=${path}, origin=${origin}`);
  
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
    // Se o Vercel passou req/res diretamente, usa o serverless-http diretamente
    if (event.req && event.res) {
      console.log('[Handler] Formato Vercel direto (req/res) detectado');
      const result = await new Promise((resolve, reject) => {
        serverless(app, {
          binary: ['image/*', 'application/pdf']
        })(event.req, event.res, (err) => {
          if (err) reject(err);
          // O serverless-http manipula req/res diretamente, então não retorna nada
          // Mas precisamos retornar uma resposta de sucesso
          resolve({
            statusCode: event.res.statusCode || 200,
            headers: event.res.getHeaders ? event.res.getHeaders() : {},
            body: ''
          });
        });
      });
      
      // Se o res já foi enviado, não retorna nada
      if (event.res.headersSent) {
        return;
      }
      
      return result;
    }
    
    // Caso contrário, usa formato AWS Lambda
    // Cria evento ajustado para o serverless-http
    // O serverless-http precisa de httpMethod e path explícitos
    const adjustedEvent = {
      ...event,
      httpMethod: method,
      path: path,
      requestContext: event.requestContext || {
        path: path,
        httpMethod: method,
        requestId: context?.requestId || context?.awsRequestId || 'vercel-request'
      }
    };
    
    console.log(`[Handler] Adjusted event: httpMethod=${adjustedEvent.httpMethod}, path=${adjustedEvent.path}`);
    
    const result = await serverless(app, {
      binary: ['image/*', 'application/pdf'],
      request: (req, evt) => {
        // Preserva o path original
        if (evt.path) {
          req.url = evt.path;
          req.originalUrl = evt.path;
        }
        // Preserva query string se existir
        if (evt.queryStringParameters) {
          const query = new URLSearchParams(evt.queryStringParameters).toString();
          if (query && !req.url.includes('?')) {
            req.url += `?${query}`;
            req.originalUrl += `?${query}`;
          }
        }
        // Preserva o método HTTP
        if (evt.httpMethod) {
          req.method = evt.httpMethod;
        }
      }
    })(adjustedEvent, context);
    
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

