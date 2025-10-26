/**
 * Printful API Proxy Worker
 * Compatible con Cloudflare Workers
 */

export default {
  async fetch(request, env, ctx) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
      // Validate API key
      if (!env.PRINTFUL_API_KEY) {
        return new Response(JSON.stringify({
          error: 'API key not configured'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const url = new URL(request.url);
      const path = url.pathname;

      console.log(`${request.method} ${path}`);

      // Health check
      if (path === '/api/health') {
        return new Response(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          api_configured: !!env.PRINTFUL_API_KEY
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // API info
      if (path === '/api' || path === '/api/') {
        return new Response(JSON.stringify({
          name: 'Printful API Proxy',
          version: '1.0.0',
          endpoints: [
            'GET /api/health - Health check',
            'GET /api/products - List MY store products',
            'GET /api/products/{id} - Get specific product details',
            'GET /api/orders - List MY store orders'
          ]
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Products endpoint - MEJORADO: maneja productos generales y específicos
      if (path.startsWith('/api/products')) {
        // Extraer el ID del producto si existe en la URL
        const pathParts = path.split('/');
        const productId = pathParts[3]; // Para /api/products/123
        
        let printfulUrl;
        
        if (productId) {
          // Si hay ID, obtener producto específico
          printfulUrl = `https://api.printful.com/store/products/${productId}`;
        } else {
          // Si no hay ID, obtener lista de productos
          const limit = url.searchParams.get('limit') || '20';
          const offset = url.searchParams.get('offset') || '0';
          printfulUrl = `https://api.printful.com/store/products?limit=${limit}&offset=${offset}`;
        }

        const response = await fetch(printfulUrl, {
          headers: {
            'Authorization': `Bearer ${env.PRINTFUL_API_KEY}`,
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();
        return new Response(JSON.stringify(data), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Orders endpoint
      if (path.startsWith('/api/orders')) {
        if (request.method === 'GET') {
          const printfulUrl = 'https://api.printful.com/store/orders';
          const response = await fetch(printfulUrl, {
            headers: {
              'Authorization': `Bearer ${env.PRINTFUL_API_KEY}`,
              'Content-Type': 'application/json',
            }
          });

          const data = await response.json();
          return new Response(JSON.stringify(data), {
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // Default response
      return new Response(JSON.stringify({
        message: 'Printful API Proxy - Working',
        available_endpoints: [
          '/api/health',
          '/api',
          '/api/products',
          '/api/products/{id}',
          '/api/orders'
        ]
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};