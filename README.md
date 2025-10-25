# Printful Worker - Cloudflare

Worker de Cloudflare para interactuar con la API de Printful de manera segura.

## 🚀 Características

- ✅ Proxy seguro para API de Printful
- ✅ CORS configurado para uso en aplicaciones web
- ✅ Manejo de errores robusto
- ✅ Endpoints organizados para productos y pedidos
- ✅ Health check para monitoreo

## 📁 Estructura del proyecto

```
printful-worker-project/
├── src/
│   └── index.js          # Worker principal
├── wrangler.toml         # Configuración de Cloudflare
├── package.json          # Dependencias
└── README.md            # Este archivo
```

## 🔧 Configuración

### 1. Variables de entorno

En Cloudflare Dashboard > Workers & Pages > Tu Worker > Settings > Variables:

**Variables obligatorias:**
- `PRINTFUL_API_KEY` (tipo: Encrypt) - Tu API key de Printful

**Variables opcionales:**
- `PRINTFUL_LANGUAGE` (tipo: Variable) - Idioma por defecto: `es_ES`

### 2. Autenticación

```bash
# Iniciar sesión en Cloudflare
npx wrangler login

# Verificar autenticación
npx wrangler whoami
```

## 🚀 Despliegue

### Opción A: Desarrollo local
```bash
npx wrangler dev
```

### Opción B: Despliegue directo
```bash
npx wrangler deploy
```

## 🌐 Endpoints disponibles

### Health Check
```
GET /api/health
```
Respuesta:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "api_configured": true
}
```

### API Info
```
GET /api
```
Respuesta:
```json
{
  "name": "Printful API Proxy",
  "version": "1.0.0",
  "endpoints": [
    "GET /api/health - Health check",
    "GET /api/products - List products",
    "GET /api/orders - List orders"
  ]
}
```

### Productos
```
GET /api/products
```
Retorna la lista de productos de tu cuenta de Printful.

### Pedidos
```
GET /api/orders
```
Retorna la lista de pedidos de tu cuenta de Printful.

## 🧪 Testing

### Probar localmente
```bash
# Iniciar worker en modo desarrollo
npx wrangler dev
```

En otra terminal:
```bash
# Health check
curl http://localhost:8787/api/health

# API info
curl http://localhost:8787/api

# Productos
curl http://localhost:8787/api/products
```

### Probar en producción
```bash
# Health check (reemplaza con tu URL real)
curl https://tu-worker.tu-cuenta.workers.dev/api/health

# Productos
curl https://tu-worker.tu-cuenta.workers.dev/api/products
```

## 🔍 Logs

### Ver logs en tiempo real
```bash
npx wrangler tail
```

### Ver logs en el dashboard
Cloudflare Dashboard > Workers & Pages > Tu Worker > Logs

## 🐛 Solución de problemas

### Error: "No event handlers were registered"
- **Causa**: Sintaxis incorrecta del worker
- **Solución**: Asegúrate de usar `export default { async fetch() }`

### Error: "API key not configured"
- **Causa**: Variable de entorno faltante
- **Solución**: Configura `PRINTFUL_API_KEY` en el dashboard

### Error: "Failed to match Worker name"
- **Causa**: Nombre del worker no coincide
- **Solución**: Verifica que el `name` en `wrangler.toml` coincida con el configurado

## 📝 Variables requeridas

| Variable | Tipo | Descripción | Requerido |
|----------|------|-------------|-----------|
| `PRINTFUL_API_KEY` | Encrypt | API key de Printful | ✅ |
| `PRINTFUL_LANGUAGE` | Variable | Idioma (es_ES) | ❌ |

## 🔒 Seguridad

- API keys se almacenan de forma encriptada
- CORS configurado para permitir llamadas desde navegadores
- Validación de inputs para prevenir inyecciones
- Logs encriptados para debugging

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs: `npx wrangler tail`
2. Verifica las variables de entorno en el dashboard
3. Confirma que tu API key de Printful es válida
4. Prueba el health check primero

## 🚀 Desplegar

¡Todo listo! Ejecuta estos comandos:

```bash
# 1. Instalar dependencias (opcional)
npm install

# 2. Configurar variables de entorno en el dashboard
# 3. Desplegar
npx wrangler deploy

# 4. Probar
curl https://tu-worker.tu-cuenta.workers.dev/api/health
```