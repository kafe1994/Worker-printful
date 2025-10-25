/**
 * Cloudflare Pages Function - Printful API Proxy
 * 
 * Worker optimizado y simplificado para Cloudflare Pages
 * Compatible con Printful API v1
 * 
 * Variables de entorno requeridas:
 * - PRINTFUL_API_KEY: Tu API key de Printful
 * 
 * Endpoints disponibles:
 * - GET /api/health - Verificar estado del servicio
 * - GET /api/products - Listar productos de Printful
 * - GET /api/products/{id} - Obtener producto específico
 * - GET /api/orders - Listar pedidos
 * - POST /api/orders - Crear nuevo pedido
 * - GET /api/orders/{id} - Obtener pedido específico
 * - GET /api/stores - Listar tiendas conectadas
 * - GET /api/files - Listar archivos en la biblioteca
 */

export async function onRequest(context) {
  const { request, env } = context;
  
  // Configuración CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Store-Id, X-PF-Language',
    'Access-Control-Max-Age': '86400',
  };

  // Manejar preflight requests
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
      return new Response(JSON.stringify({
        error: {
          code: 'CONFIGURATION_ERROR',
          title: 'API key no configurada',
          message: 'Por favor configura PRINTFUL_API_KEY en las variables de entorno de Pages',
          timestamp: new Date().toISOString()
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const params = url.searchParams;

    console.log(`${method} ${path} - ${new Date().toISOString()}`);

    // Enrutamiento principal
    let response;

    // Health Check
    if (path === '/api/health') {
      response = await handleHealthCheck(env, corsHeaders);
    }
    // Info de la API
    else if (path === '/api' || path === '/api/') {
      response = await handleApiInfo(corsHeaders);
    }
    // Productos
    else if (path.startsWith('/api/products')) {
      response = await handleProductsRequest(request, path, params, method, env, corsHeaders);
    }
    // Pedidos
    else if (path.startsWith('/api/orders')) {
      response = await handleOrdersRequest(request, path, params, method, env, corsHeaders);
    }
    // Tiendas
    else if (path.startsWith('/api/stores')) {
      response = await handleStoresRequest(path, params, method, env, corsHeaders);
    }
    // Archivos
    else if (path.startsWith('/api/files')) {
      response = await handleFilesRequest(path, params, method, env, corsHeaders);
    }
    // Endpoint no encontrado
    else {
      response = new Response(JSON.stringify({
        error: {
          code: 'ENDPOINT_NOT_FOUND',
          title: 'Endpoint no encontrado',
          message: `El endpoint ${path} no está disponible`,
          timestamp: new Date().toISOString()
        }
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Agregar headers de respuesta
    response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
    response.headers.set('X-Worker-Version', '2.0.0-pages');
    
    return response;

  } catch (error) {
    console.error('Error no controlado:', error);
    
    return new Response(JSON.stringify({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        title: 'Error interno del servidor',
        message: error.message || 'Ha ocurrido un error inesperado',
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Manejo de endpoints de productos
 */
async function handleProductsRequest(request, path, params, method, env, corsHeaders) {
  try {
    // GET /api/products o GET /api/products/{id}
    const productMatch = path.match(/\/api\/products\/(\d+)/);
    
    let printfulPath = '/products';
    if (productMatch) {
      printfulPath = `/products/${productMatch[1]}`;
    }
    
    // Agregar parámetros de query
    if (params.toString()) {
      printfulPath += `?${params.toString()}`;
    }

    return await makePrintfulRequest('GET', printfulPath, null, env, corsHeaders);
    
  } catch (error) {
    console.error('Error en productos:', error);
    return createErrorResponse('PRODUCTS_ERROR', 'Error procesando productos', error.message, 500, corsHeaders);
  }
}

/**
 * Manejo de endpoints de pedidos
 */
async function handleOrdersRequest(request, path, params, method, env, corsHeaders) {
  try {
    const orderMatch = path.match(/\/api\/orders\/(\d+)/);
    
    // Endpoint específico de pedido
    if (orderMatch) {
      const orderId = orderMatch[1];
      
      if (method === 'GET') {
        return await makePrintfulRequest('GET', `/orders/${orderId}`, null, env, corsHeaders);
      } else if (method === 'PUT') {
        const body = await request.text();
        return await makePrintfulRequest('PUT', `/orders/${orderId}`, body, env, corsHeaders);
      } else if (method === 'DELETE') {
        return await makePrintfulRequest('DELETE', `/orders/${orderId}`, null, env, corsHeaders);
      }
    }
    // Lista de pedidos
    else if (path === '/api/orders') {
      if (method === 'GET') {
        let printfulPath = '/orders';
        if (params.toString()) {
          printfulPath += `?${params.toString()}`;
        }
        return await makePrintfulRequest('GET', printfulPath, null, env, corsHeaders);
      } else if (method === 'POST') {
        const body = await request.text();
        return await makePrintfulRequest('POST', '/orders', body, env, corsHeaders);
      }
    }

    return createErrorResponse('ORDERS_INVALID_ROUTE', 'Ruta de pedidos inválida', 
      `No se pudo procesar ${path} con método ${method}`, 404, corsHeaders);
    
  } catch (error) {
    console.error('Error en pedidos:', error);
    return createErrorResponse('ORDERS_ERROR', 'Error procesando pedidos', error.message, 500, corsHeaders);
  }
}

/**
 * Manejo de endpoints de tiendas
 */
async function handleStoresRequest(path, params, method, env, corsHeaders) {
  try {
    const storeMatch = path.match(/\/api\/stores\/(\d+)/);
    
    if (storeMatch) {
      const storeId = storeMatch[1];
      return await makePrintfulRequest('GET', `/stores/${storeId}`, null, env, corsHeaders);
    } else if (path === '/api/stores') {
      return await makePrintfulRequest('GET', '/stores', null, env, corsHeaders);
    }

    return createErrorResponse('STORES_INVALID_ROUTE', 'Ruta de tiendas inválida', 
      `No se pudo procesar ${path}`, 404, corsHeaders);
    
  } catch (error) {
    console.error('Error en tiendas:', error);
    return createErrorResponse('STORES_ERROR', 'Error procesando tiendas', error.message, 500, corsHeaders);
  }
}

/**
 * Manejo de endpoints de archivos
 */
async function handleFilesRequest(path, params, method, env, corsHeaders) {
  try {
    const fileMatch = path.match(/\/api\/files\/(\d+)/);
    
    if (fileMatch) {
      const fileId = fileMatch[1];
      return await makePrintfulRequest('GET', `/files/${fileId}`, null, env, corsHeaders);
    } else if (path === '/api/files') {
      if (method === 'GET') {
        return await makePrintfulRequest('GET', '/files', null, env, corsHeaders);
      } else if (method === 'POST') {
        const body = await request.text();
        return await makePrintfulRequest('POST', '/files', body, env, corsHeaders);
      }
    }

    return createErrorResponse('FILES_INVALID_ROUTE', 'Ruta de archivos inválida', 
      `No se pudo procesar ${path}`, 404, corsHeaders);
    
  } catch (error) {
    console.error('Error en archivos:', error);
    return createErrorResponse('FILES_ERROR', 'Error procesando archivos', error.message, 500, corsHeaders);
  }
}

/**
 * Health check endpoint
 */
async function handleHealthCheck(env, corsHeaders) {
  const isHealthy = !!env.PRINTFUL_API_KEY;
  
  return new Response(JSON.stringify({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0-pages',
    printful_api: isHealthy ? 'configured' : 'not_configured',
    environment: 'cloudflare-pages'
  }), {
    status: isHealthy ? 200 : 503,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * API info endpoint
 */
async function handleApiInfo(corsHeaders) {
  return new Response(JSON.stringify({
    name: 'Printful Cloudflare Pages API',
    version: '2.0.0-pages',
    description: 'Proxy optimizado para la API de Printful - Compatible con Cloudflare Pages',
    endpoints: [
      'GET /api/health - Health check',
      'GET /api - Información de la API',
      'GET /api/products - Listar productos',
      'GET /api/products/{id} - Obtener producto específico',
      'GET /api/orders - Listar pedidos',
      'POST /api/orders - Crear pedido',
      'GET /api/orders/{id} - Obtener pedido específico',
      'GET /api/stores - Listar tiendas',
      'GET /api/files - Listar archivos'
    ],
    documentation: 'https://developers.printful.com/docs/',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * Función principal para hacer requests a Printful
 */
async function makePrintfulRequest(method, path, body, env, corsHeaders) {
  const baseUrl = 'https://api.printful.com';
  const url = baseUrl + path;

  const headers = {
    'Authorization': `Bearer ${env.PRINTFUL_API_KEY}`,
    'Content-Type': 'application/json',
    'User-Agent': 'Printful-Cloudflare-Pages/2.0.0',
  };

  // Idioma configurable
  if (env.PRINTFUL_LANGUAGE) {
    headers['X-PF-Language'] = env.PRINTFUL_LANGUAGE;
  }

  // Store ID configurable
  if (env.PRINTFUL_STORE_ID) {
    headers['X-PF-Store-Id'] = env.PRINTFUL_STORE_ID;
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

    console.log(`← Printful API: ${response.status} ${method} ${url}`);

    // Manejar errores de Printful
    if (!response.ok) {
      const errorData = typeof responseData === 'object' ? responseData : { message: responseText };
      
      return new Response(JSON.stringify({
        error: {
          code: 'PRINTFUL_API_ERROR',
          title: `Error en API de Printful (${response.status})`,
          message: errorData?.error || errorData?.message || 'Error desconocido de Printful',
          timestamp: new Date().toISOString(),
          details: errorData
        }
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Respuesta exitosa
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Printful-Status': response.status.toString()
      }
    });

  } catch (error) {
    console.error(`❌ Error conectando con Printful API:`, error);
    
    return new Response(JSON.stringify({
      error: {
        code: 'PRINTFUL_CONNECTION_ERROR',
        title: 'Error de conexión con Printful',
        message: `No se pudo conectar con la API de Printful: ${error.message}`,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Crear respuesta de error estándar
 */
function createErrorResponse(code, title, message, status, corsHeaders) {
  return new Response(JSON.stringify({
    error: {
      code: code,
      title: title,
      message: message,
      timestamp: new Date().toISOString()
    }
  }), {
    status: status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}