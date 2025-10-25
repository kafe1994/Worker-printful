# Cloudflare Worker para Printful API

Un proxy completo y funcional para la API de Printful desplegado en Cloudflare Workers.

## 🚀 Características

- ✅ **Proxy completo** para la API de Printful
- ✅ **Autenticación automática** con Bearer Token
- ✅ **Manejo de CORS** completo para uso frontend
- ✅ **Rate limiting** compatible con Printful (120 req/min)
- ✅ **Manejo robusto de errores** con logs detallados
- ✅ **Endpoints de salud** para monitoreo
- ✅ **Configuración multiidioma**

## 📦 Instalación Rápida

### 1. **Requisitos**
- Cuenta en Cloudflare
- API Key de Printful
- Node.js instalado

### 2. **Clonar el proyecto**
```bash
git clone https://github.com/tu-usuario/printful-cloudflare-worker.git
cd printful-cloudflare-worker
```

### 3. **Instalar dependencias**
```bash
npm install
```

### 4. **Autenticar con Cloudflare**
```bash
wrangler login
```

### 5. **Configurar variables secretas**
```bash
# En el dashboard de Cloudflare Workers:
# 1. Ve a tu worker
# 2. Settings > Variables
# 3. Add Variable: PRINTFUL_API_KEY (Encrypt)
```

### 6. **Desplegar**
```bash
wrangler deploy
```

## 🌐 Endpoints Disponibles

### Productos (Catalog API)
```http
GET /api/products                    # Listar productos
GET /api/products/{id}              # Producto específico
GET /api/products?category_id=24    # Con filtros
```

### Pedidos (Orders API)
```http
GET /api/orders                     # Listar pedidos
POST /api/orders                    # Crear pedido
GET /api/orders/{id}                # Pedido específico
PUT /api/orders/{id}                # Actualizar pedido
POST /api/orders/{id}/confirm       # Confirmar pedido
DELETE /api/orders/{id}             # Cancelar pedido
```

### Archivos (File Library API)
```http
POST /api/files                     # Subir archivo
GET /api/files/{id}                 # Info de archivo
```

### Webhooks
```http
GET /api/webhooks                   # Listar webhooks
POST /api/webhooks                  # Configurar webhook
DELETE /api/webhooks                # Eliminar webhook
```

### Monitoreo
```http
GET /api/health                     # Health check
```

## 💡 Ejemplos de Uso

### JavaScript/React
```javascript
// Obtener productos
const productos = await fetch('/api/products')
  .then(res => res.json());

// Crear pedido
const pedido = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipient: {
      name: "Juan Pérez",
      address1: "Calle 123",
      city: "Madrid",
      state_code: "MD",
      country_code: "ES",
      zip: "28001"
    },
    items: [{
      variant_id: 3001,
      quantity: 1,
      files: [{ url: "https://mi-sitio.com/diseno.png" }]
    }]
  })
}).then(res => res.json());
```

### cURL
```bash
# Health check
curl https://tu-worker.workers.dev/api/health

# Listar productos
curl https://tu-worker.workers.dev/api/products

# Crear pedido
curl -X POST https://tu-worker.workers.dev/api/orders \
  -H "Content-Type: application/json" \
  -d '{"recipient": {...}, "items": [{...}]}'
```

## 🔧 Desarrollo Local

```bash
# Modo desarrollo con hot reload
wrangler dev

# Preview local
wrangler preview

# Ver logs en tiempo real
wrangler tail
```

## 📁 Estructura del Proyecto

```
├── printful-worker.js          # Worker principal
├── wrangler.toml              # Configuración
├── package.json               # Dependencias
├── .gitignore                 # Archivos ignorados
├── README.md                  # Este archivo
└── ejemplos-practicos.js      # Ejemplos de código
```

## 🛠️ Configuración

### Variables de Entorno
- `PRINTFUL_API_KEY`: Tu API key de Printful (obligatorio)

### Headers por Defecto
- `X-PF-Language`: `es_ES` (configurable)
- `Authorization`: Bearer token automático

### Rate Limiting
- Respeta automáticamente los límites de Printful
- 120 requests/minuto general
- 10 requests/minuto para operaciones intensivas

## 🔍 Solución de Problemas

### Error 500 "API key no configurada"
1. Verifica que `PRINTFUL_API_KEY` esté configurada en el dashboard
2. Confirma que el nombre de la variable sea exacto
3. Redeploya el worker

### Error 401 "Unauthorized"
1. Verifica que la API key sea válida
2. Confirma que tengas permisos en Printful

### CORS errors
1. El worker incluye CORS preconfigurado
2. Verifica que la URL sea correcta

## 📊 Monitoreo

### Health Check
```bash
curl https://tu-worker.workers.dev/api/health
```

### Logs
```bash
wrangler tail
```

### Métricas disponibles
- Status de salud del worker
- Tiempo de respuesta de API
- Rate limiting status
- Errores de conexión

## 📚 Documentación

- [Documentación oficial de Printful API](https://developers.printful.com/docs/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👤 Autor

**Tu Nombre**
- GitHub: [@tu-usuario](https://github.com/tu-usuario)
- Email: tu-email@ejemplo.com

## 🙏 Agradecimientos

- [Cloudflare Workers](https://workers.cloudflare.com/) por la plataforma
- [Printful](https://www.printful.com/) por la API
- Comunidad de desarrolladores por los recursos y herramientas

---

**⭐ Si este proyecto te ha sido útil, ¡dale una estrella en GitHub!**