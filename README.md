# Cloudflare Worker para API de Printful

Este worker de Cloudflare proporciona una interfaz funcional para la API de Printful, manejando automáticamente la autenticación, CORS y errores.

## 🚀 Características

- ✅ Autenticación automática con Bearer Token
- ✅ Manejo completo de CORS
- ✅ Proxy funcional para todos los endpoints principales de Printful
- ✅ Manejo robusto de errores
- ✅ Rate limiting compatible con las limitaciones de Printful (120 req/min)
- ✅ Soporte para múltiples idiomas
- ✅ Endpoints de salud para monitoreo

## 📋 Requisitos Previos

1. Una cuenta en Printful con API access
2. Una API Key de Printful
3. Una cuenta en Cloudflare Workers

## 🛠️ Configuración

### 1. Variables de Entorno

En tu dashboard de Cloudflare Workers, agrega una variable secreta:

- **Nombre:** `PRINTFUL_API_KEY`
- **Valor:** Tu API key de Printful (sin comillas)

### 2. Despliegue

Sube el archivo `printful-worker.js` a tu proyecto de Cloudflare Workers.

## 📡 Endpoints Disponibles

### Productos (Catalog API)

```javascript
// Obtener todos los productos
GET /api/products

// Obtener producto específico
GET /api/products/{id}

// Obtener productos con filtros
GET /api/products?category_id=24,25
```

### Pedidos (Orders API)

```javascript
// Obtener todos los pedidos
GET /api/orders

// Obtener pedidos con filtros
GET /api/orders?status=pending&limit=10

// Crear nuevo pedido
POST /api/orders
{
  "recipient": {
    "name": "John Smith",
    "address1": "123 Test St",
    "city": "Los Angeles",
    "state_code": "CA",
    "country_code": "US",
    "zip": "90001"
  },
  "items": [
    {
      "variant_id": 3001,
      "quantity": 1,
      "files": [
        {
          "url": "https://ejemplo.com/mi-diseno.png"
        }
      ]
    }
  ]
}

// Obtener pedido específico
GET /api/orders/{id}

// Actualizar pedido
PUT /api/orders/{id}

// Confirmar pedido (enviar a producción)
POST /api/orders/{id}/confirm

// Cancelar pedido
DELETE /api/orders/{id}
```

### Archivos (File Library API)

```javascript
// Subir archivo a la biblioteca
POST /api/files
{
  "url": "https://ejemplo.com/mi-diseno.png",
  "type": "default",
  "filename": "mi-diseno-personalizado.png"
}

// Obtener información de archivo
GET /api/files/{id}
```

### Tiendas (Stores API)

```javascript
// Obtener información de todas las tiendas
GET /api/stores

// Obtener información de tienda específica
GET /api/stores/{store_id}
```

### Webhooks

```javascript
// Obtener webhooks configurados
GET /api/webhooks

// Configurar webhook
POST /api/webhooks
{
  "url": "https://tu-sitio.com/webhook/printful",
  "types": ["order_created", "order_fulfilled", "package_shipped"]
}

// Eliminar webhook
DELETE /api/webhooks
```

### Health Check

```javascript
// Verificar estado del worker
GET /api/health
```

## 💡 Ejemplos de Uso

### Frontend JavaScript

```javascript
// Obtener productos
async function obtenerProductos() {
  const response = await fetch('/api/products');
  const data = await response.json();
  return data;
}

// Crear pedido
async function crearPedido(datosPedido) {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(datosPedido)
  });
  
  const data = await response.json();
  return data;
}

// Subir diseño
async function subirDiseño(urlDiseño, tipo = 'default') {
  const response = await fetch('/api/files', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: urlDiseño,
      type: tipo
    })
  });
  
  const data = await response.json();
  return data;
}
```

### React Example

```jsx
import React, { useState, useEffect } from 'react';

function ProductosPrintful() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarProductos() {
      try {
        const response = await fetch('/api/products');
        const data = await response.json();
        setProductos(data.result || []);
      } catch (error) {
        console.error('Error cargando productos:', error);
      } finally {
        setLoading(false);
      }
    }

    cargarProductos();
  }, []);

  if (loading) return <div>Cargando productos...</div>;

  return (
    <div>
      <h2>Productos Disponibles</h2>
      {productos.map(producto => (
        <div key={producto.id} className="producto">
          <h3>{producto.title}</h3>
          <p>ID: {producto.id}</p>
          <p>Tipo: {producto.type}</p>
        </div>
      ))}
    </div>
  );
}
```

### Crear Pedido Completo

```javascript
async function crearPedidoCompleto() {
  const pedidoData = {
    external_id: "pedido_" + Date.now(),
    recipient: {
      name: "Juan Pérez",
      address1: "Calle Principal 123",
      city: "Madrid",
      state_code: "MD",
      country_code: "ES",
      zip: "28001",
      phone: "+34 123 456 789",
      email: "juan@ejemplo.com"
    },
    items: [
      {
        variant_id: 3001, // ID de variante del producto
        quantity: 2,
        retail_price: "25.99",
        files: [
          {
            url: "https://tu-sitio.com/diseno-frente.png",
            type: "front"
          },
          {
            url: "https://tu-sitio.com/diseno-espalda.png", 
            type: "back"
          }
        ],
        options: [
          {
            id: "print_type",
            value: "DTG"
          }
        ]
      }
    ],
    shipping: "STANDARD",
    packing_slip: {
      email: "tienda@ejemplo.com",
      message: "Gracias por tu compra!",
      store_name: "Mi Tienda Custom"
    }
  };

  try {
    const response = await fetch('/api/orders?confirm=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pedidoData)
    });
    
    const resultado = await response.json();
    
    if (response.ok) {
      console.log('Pedido creado exitosamente:', resultado);
      return resultado;
    } else {
      console.error('Error creando pedido:', resultado);
      return null;
    }
  } catch (error) {
    console.error('Error de conexión:', error);
    return null;
  }
}
```

## 🔧 Personalización

### Cambiar Idioma

El worker está configurado para usar español (`es_ES`) por defecto. Para cambiarlo, modifica esta línea en el worker:

```javascript
'X-PF-Language': 'es_ES', // Cambiar por 'en_US', 'fr_FR', etc.
```

### Agregar Store ID

Para trabajar con múltiples tiendas, puedes modificar la función `getStoreIdFromRequest()` para extraer el store ID del request.

### Rate Limiting

El worker respeta automáticamente los límites de Printful (120 requests/minuto). Para operaciones intensivas como generación de mockups, considera implementar delays adicionales.

## 📊 Monitoreo

### Health Check Endpoint

```bash
curl https://tu-worker.workers.dev/api/health
```

### Logs

Los logs del worker incluirán:
- Requests realizados a Printful
- Respuestas recibidas
- Errores de conexión
- Status codes de respuesta

## 🛡️ Seguridad

- La API key se almacena de forma segura como variable secreta
- Solo acepta requests con CORS configurado
- Valida todos los inputs antes de procesar
- Maneja errores sin exponer información sensible

## 🚀 Despliegue en Producción

1. **Configurar Variables Secretas:**
   - Ve a tu dashboard de Cloudflare Workers
   - Agrega `PRINTFUL_API_KEY` en Variables > Add Variable
   - Selecciona "Encrypt" para seguridad adicional

2. **Subir el Worker:**
   ```bash
   wrangler deploy
   ```

3. **Configurar Dominio Personalizado (opcional):**
   - En tu dashboard de Cloudflare, ve a Workers > Settings > Add Route
   - Configura tu dominio personalizado

## 📝 Notas Importantes

1. **Rate Limiting:** Respeta los límites de 120 req/min de Printful
2. **Autenticación:** Usa OAuth Bearer tokens de Printful
3. **CORS:** Configurado para permitir requests desde cualquier origen
4. **Errores:** Todos los errores incluyen detalles útiles para debugging
5. **Idiomas:** Soporta múltiples idiomas via header X-PF-Language

## 🆘 Solución de Problemas

### Error 401 (Unauthorized)
- Verifica que `PRINTFUL_API_KEY` esté configurada correctamente
- Confirma que la API key sea válida en tu cuenta de Printful

### Error 429 (Rate Limited)
- Implementa delays entre requests
- El worker maneja automáticamente algunos casos de rate limiting

### Error 500 (Internal Server Error)
- Revisa los logs del worker en el dashboard de Cloudflare
- Verifica la conectividad con Printful

## 📚 Referencias

- [Documentación oficial de Printful API](https://developers.printful.com/docs/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Printful API Rate Limits](https://developers.printful.com/docs/#api-rate-limits)