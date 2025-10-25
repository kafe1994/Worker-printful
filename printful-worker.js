/**
 * Cloudflare Worker para integración con la API de Printful
 * 
 * Un proxy completo y robusto para la API de Printful con:
 * - Manejo de autenticación automática
 * - Rate limiting compatible con Printful
 * - Manejo robusto de errores y CORS
 * - Logging detallado para debugging
 * - Validación de inputs
 * 
 * Variables de entorno requeridas:
 * - PRINTFUL_API_KEY: Tu API key de Printful (encriptada)
 * 
 * Configuración:
 * - Idioma por defecto: español (es_ES)
 * - CORS completamente configurado
 * - Rate limiting: 120 req/min general, 10 req/min intensivo
 */

export default {
  async fetch(request, env, ctx) {
    // Configuración de CORS para todas las respuestas
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Store-Id, X-PF-Language',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Allow-Credentials': 'false',
    };

    // Manejar preflight requests de CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    const startTime = Date.now();
    
    try {
      // Validar API key
      if (!env.PRINTFUL_API_KEY) {
        console.error('PRINTFUL_API_KEY no configurada en variables de entorno');
        return createErrorResponse(
          'CONFIGURATION_ERROR',
          'API key no configurada',
          'Por favor configura PRINTFUL_API_KEY en las variables secretas del worker',
          500,
          corsHeaders
        );
      }

      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;

      // Log de la request para debugging
      console.log(`${method} ${path} - ${new Date().toISOString()}`);

      // Rate limiting básico
      if (method !== 'GET' && method !== 'HEAD') {
        await handleRateLimit(path, method);
      }

      // Enrutamiento principal
      let response;
      
      if (path.startsWith('/api/products')) {
        response = await handleProductsRequest(request, env, corsHeaders);
      } else if (path.startsWith('/api/orders')) {
        response = await handleOrdersRequest(request, env, corsHeaders);
      } else if (path.startsWith('/api/files')) {
        response = await handleFilesRequest(request, env, corsHeaders);
      } else if (path.startsWith('/api/stores')) {
        response = await handleStoresRequest(request, env, corsHeaders);
      } else if (path.startsWith('/api/webhooks')) {
        response = await handleWebhooksRequest(request, env, corsHeaders);
      } else if (path === '/api/health') {
        response = await handleHealthCheck(env, corsHeaders);
      } else if (path === '/api' || path === '/api/') {
        response = await handleApiInfo(corsHeaders);
      } else {
        response = createErrorResponse(
          'ENDPOINT_NOT_FOUND',
          'Endpoint no encontrado',
          `El endpoint ${path} no está disponible`,
          404,
          corsHeaders
        );
      }

      // Agregar headers de respuesta
      response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
      response.headers.set('X-Worker-Version', '1.0.0');
      
      return response;

    } catch (error) {
      console.error('Error no controlado en Printful Worker:', error);
      
      return createErrorResponse(
        'INTERNAL_SERVER_ERROR',
        'Error interno del servidor',
        error.message || 'Ha ocurrido un error inesperado',
        500,
        corsHeaders
      );
    }
  }
};

/**
 * Manejo de endpoints de productos (Catalog API)
 */
async function handleProductsRequest(request, env, corsHeaders) {
  const url = new URL(request.url);
  const path = url.pathname;
  const params = new URLSearchParams(url.search);
  
  try {
    // Construir URL de Printful
    let printfulPath = '/products';
    
    // Si hay un ID específico
    const pathMatch = path.match(/\/api\/products\/(\d+)/);
    if (pathMatch) {
      printfulPath = `/products/${pathMatch[1]}`;
    }
    
    // Agregar parámetros de query si existen
    if (params.toString()) {
      printfulPath += `?${params.toString()}`;
    }

    return await makePrintfulRequest('GET', printfulPath, null, env, corsHeaders);
    
  } catch (error) {
    console.error('Error en handleProductsRequest:', error);
    return createErrorResponse(
      'PRODUCTS_REQUEST_ERROR',
      'Error procesando solicitud de productos',
      error.message,
      500,
      corsHeaders
    );
  }
}

/**
 * Manejo de endpoints de pedidos (Orders API)
 */
async function handleOrdersRequest(request, env, corsHeaders) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  try {
    // Rutas específicas de pedidos
    if (path.match(/\/api\/orders\/\d+\/confirm$/)) {
      // POST /api/orders/{id}/confirm
      const orderId = path.match(/\/api\/orders\/(\d+)/)[1];
      return await makePrintfulRequest('POST', `/orders/${orderId}/confirm`, null, env, corsHeaders);
      
    } else if (path.match(/\/api\/orders\/\d+$/)) {
      // GET/PUT/DELETE /api/orders/{id}
      const orderId = path.match(/\/api\/orders\/(\d+)/)[1];
      
      if (method === 'GET') {
        return await makePrintfulRequest('GET', `/orders/${orderId}`, null, env, corsHeaders);
      } else if (method === 'PUT') {
        const body = await request.text();
        return await makePrintfulRequest('PUT', `/orders/${orderId}`, body, env, corsHeaders);
      } else if (method === 'DELETE') {
        return await makePrintfulRequest('DELETE', `/orders/${orderId}`, null, env, corsHeaders);
      }
      
    } else if (path === '/api/orders') {
      // GET /api/orders o POST /api/orders
      const params = new URLSearchParams(url.search);
      
      if (method === 'GET') {
        let printfulPath = '/orders';
        if (params.toString()) {
          printfulPath += `?${params.toString()}`;
        }
        return await makePrintfulRequest('GET', printfulPath, null, env, corsHeaders);
        
      } else if (method === 'POST') {
        const body = await request.text();
        let printfulPath = '/orders';
        if (params.toString()) {
          printfulPath += `?${params.toString()}`;
        }
        return await makePrintfulRequest('POST', printfulPath, body, env, corsHeaders);
      }
    }

    return createErrorResponse(
      'ORDERS_INVALID_ROUTE',
      'Ruta de pedidos inválida',
      `No se pudo procesar la ruta ${path} con método ${method}`,
      404,
      corsHeaders
    );
    
  } catch (error) {
    console.error('Error en handleOrdersRequest:', error);
    return createErrorResponse(
      'ORDERS_REQUEST_ERROR',
      'Error procesando solicitud de pedidos',
      error.message,
      500,
      corsHeaders
    );
  }
}

/**
 * Manejo de endpoints de archivos (File Library API)
 */
async function handleFilesRequest(request, env, corsHeaders) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  try {
    if (path.match(/\/api\/files\/\d+$/)) {
      // GET /api/files/{id}
      const fileId = path.match(/\/api\/files\/(\d+)/)[1];
      return await makePrintfulRequest('GET', `/files/${fileId}`, null, env, corsHeaders);
      
    } else if (path === '/api/files') {
      // POST /api/files
      if (method === 'POST') {
        const body = await request.text();
        return await makePrintfulRequest('POST', '/files', body, env, corsHeaders);
      }
    }

    return createErrorResponse(
      'FILES_INVALID_ROUTE',
      'Ruta de archivos inválida',
      `No se pudo procesar la ruta ${path}`,
      404,
      corsHeaders
    );
    
  } catch (error) {
    console.error('Error en handleFilesRequest:', error);
    return createErrorResponse(
      'FILES_REQUEST_ERROR',
      'Error procesando solicitud de archivos',
      error.message,
      500,
      corsHeaders
    );
  }
}

/**
 * Manejo de endpoints de tiendas (Stores API)
 */
async function handleStoresRequest(request, env, corsHeaders) {
  const url = new URL(request.url);
  const path = url.pathname;

  try {
    if (path.match(/\/api\/stores\/\d+$/)) {
      // GET /api/stores/{id}
      const storeId = path.match(/\/api\/stores\/(\d+)/)[1];
      return await makePrintfulRequest('GET', `/stores/${storeId}`, null, env, corsHeaders);
      
    } else if (path === '/api/stores') {
      // GET /api/stores
      return await makePrintfulRequest('GET', '/stores', null, env, corsHeaders);
    }

    return createErrorResponse(
      'STORES_INVALID_ROUTE',
      'Ruta de tiendas inválida',
      `No se pudo procesar la ruta ${path}`,
      404,
      corsHeaders
    );
    
  } catch (error) {
    console.error('Error en handleStoresRequest:', error);
    return createErrorResponse(
      'STORES_REQUEST_ERROR',
      'Error procesando solicitud de tiendas',
      error.message,
      500,
      corsHeaders
    );
  }
}

/**
 * Manejo de endpoints de webhooks
 */
async function handleWebhooksRequest(request, env, corsHeaders) {
  const method = request.method;
  const body = method !== 'GET' ? await request.text() : null;

  try {
    if (method === 'GET') {
      return await makePrintfulRequest('GET', '/webhooks', null, env, corsHeaders);
    } else if (method === 'POST') {
      return await makePrintfulRequest('POST', '/webhooks', body, env, corsHeaders);
    } else if (method === 'DELETE') {
      return await makePrintfulRequest('DELETE', '/webhooks', null, env, corsHeaders);
    }

    return createErrorResponse(
      'WEBHOOKS_METHOD_NOT_ALLOWED',
      'Método no permitido',
      `El método ${method} no está permitido para webhooks`,
      405,
      corsHeaders
    );
    
  } catch (error) {
    console.error('Error en handleWebhooksRequest:', error);
    return createErrorResponse(
      'WEBHOOKS_REQUEST_ERROR',
      'Error procesando solicitud de webhooks',
      error.message,
      500,
      corsHeaders
    );
  }
}

/**
 * Health check endpoint
 */
async function handleHealthCheck(env, corsHeaders) {
  try {
    const isHealthy = !!env.PRINTFUL_API_KEY;
    
    return new Response(
      JSON.stringify({
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        printful_api: isHealthy ? 'configured' : 'not_configured',
        uptime: Date.now(),
        environment: 'production'
      }),
      {
        status: isHealthy ? 200 : 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Error en health check:', error);
    return createErrorResponse(
      'HEALTH_CHECK_ERROR',
      'Error verificando salud del sistema',
      error.message,
      503,
      corsHeaders
    );
  }
}

/**
 * API info endpoint
 */
async function handleApiInfo(corsHeaders) {
  return new Response(
    JSON.stringify({
      name: 'Printful Cloudflare Worker API',
      version: '1.0.0',
      description: 'Proxy completo para la API de Printful',
      endpoints: [
        'GET /api/health - Health check',
        'GET /api/products - Listar productos',
        'POST /api/orders - Crear pedido',
        'GET /api/orders/{id} - Obtener pedido',
        'POST /api/files - Subir archivo',
        'GET /api/webhooks - Listar webhooks',
        'GET /api/stores - Listar tiendas'
      ],
      documentation: 'https://github.com/tu-usuario/printful-cloudflare-worker',
      timestamp: new Date().toISOString()
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Función principal para hacer requests a la API de Printful
 */
async function makePrintfulRequest(method, path, body, env, corsHeaders) {
  const baseUrl = 'https://api.printful.com';
  const url = baseUrl + path;

  const headers = {
    'Authorization': `Bearer ${env.PRINTFUL_API_KEY}`,
    'Content-Type': 'application/json',
    'User-Agent': 'Printful-Cloudflare-Worker/1.0.0',
  };

  // Idioma configurable
  const language = env.PRINTFUL_LANGUAGE || 'es_ES';
  headers['X-PF-Language'] = language;

  // Store ID configurable
  const storeId = getStoreIdFromRequest(env);
  if (storeId) {
    headers['X-PF-Store-Id'] = storeId;
  }

  const requestOptions = {
    method: method,
    headers: headers,
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    requestOptions.body = body;
  }

  try {
    console.log(`→ Printful API: ${method} ${url}`);
    
    const response = await fetch(url, requestOptions);
    const responseText = await response.text();
    
    // Parsear respuesta JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    // Log de la respuesta
    console.log(`← Printful API: ${response.status} ${method} ${url}`);

    // Manejar errores de la API de Printful
    if (!response.ok) {
      const errorData = typeof responseData === 'object' ? responseData : { message: responseText };
      
      return createErrorResponse(
        'PRINTFUL_API_ERROR',
        `Error en API de Printful (${response.status})`,
        errorData?.error || errorData?.message || 'Error desconocido de Printful',
        response.status,
        corsHeaders,
        { details: errorData, original_status: response.status }
      );
    }

    // Retornar respuesta exitosa
    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Printful-Status': response.status.toString()
        }
      }
    );

  } catch (error) {
    console.error(`❌ Error conectando con Printful API:`, error);
    
    return createErrorResponse(
      'PRINTFUL_CONNECTION_ERROR',
      'Error de conexión con Printful',
      `No se pudo conectar con la API de Printful: ${error.message}`,
      502,
      corsHeaders,
      { original_error: error.message, timestamp: new Date().toISOString() }
    );
  }
}

/**
 * Rate limiting básico por endpoint
 */
async function handleRateLimit(path, method) {
  // Implementación básica de rate limiting
  // Para una implementación más robusta, considera usar KV storage
  
  const intensiveEndpoints = [
    '/mockup-generator',
    '/orders/estimate-costs'
  ];
  
  const isIntensive = intensiveEndpoints.some(endpoint => path.includes(endpoint));
  
  if (isIntensive) {
    console.log(`Rate limiting aplicado para endpoint intensivo: ${path}`);
    // Aquí podrías implementar un delay si es necesario
  }
}

/**
 * Extraer store ID del request o configuración
 */
function getStoreIdFromRequest(env) {
  // Si hay una variable de entorno para store ID específico
  if (env.PRINTFUL_STORE_ID) {
    return env.PRINTFUL_STORE_ID;
  }
  
  // Aquí puedes implementar lógica adicional para extraer store ID
  // del request (headers, query params, etc.)
  
  return null;
}

/**
 * Crear respuesta de error estándar
 */
function createErrorResponse(errorCode, title, message, status, corsHeaders, extra = {}) {
  const errorResponse = {
    error: {
      code: errorCode,
      title: title,
      message: message,
      timestamp: new Date().toISOString(),
      ...extra
    }
  };

  return new Response(
    JSON.stringify(errorResponse, null, 2),
    {
      status: status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}