# 🚀 COMANDOS PARA TERMUX - PRINTFUL WORKER

## 1. **CREAR DIRECTORIO Y ARCHIVOS**
```bash
cd $HOME
mkdir printful-worker
cd printful-worker
```

## 2. **CREAR WRANGLER.TOML**
```bash
cat > wrangler.toml << 'EOF'
name = "printful-api-worker"
main = "printful-worker.js"
compatibility_date = "2024-01-01"

[env.production]
name = "printful-api-worker"

[env.development]
name = "printful-api-worker-dev"
EOF
```

## 3. **CREAR EL WORKER**
```bash
# Opción A: Usar editor nano
nano printful-worker.js

# Opción B: Crear archivo vacío y editar después
touch printful-worker.js
```

**⚠️ IMPORTANTE**: Copia todo el contenido del archivo `printful-worker.js` que creé anteriormente dentro de este archivo.

## 4. **AUTENTICAR CON CLOUDFLARE**
```bash
wrangler login
```

## 5. **DESPLEGAR EL WORKER**
```bash
wrangler deploy
```

## 6. **CONFIGURAR API KEY MANUALMENTE**
1. Ve a [dash.cloudflare.com](https://dash.cloudflare.com)
2. Workers & Pages
3. Busca tu worker "printful-api-worker"
4. Settings → Variables
5. Add Variable:
   - Name: `PRINTFUL_API_KEY`
   - Type: `Encrypt`
   - Value: [tu_api_key_de_printful]

## 7. **PROBAR EL WORKER**
```bash
# Obtener la URL (se muestra después del deploy)
curl https://printful-api-worker.your-username.workers.dev/api/health

# Probar productos
curl https://printful-api-worker.your-username.workers.dev/api/products
```

## 8. **COMANDOS ÚTILES**
```bash
# Ver logs en tiempo real
wrangler tail

# Ver información de cuenta
wrangler whoami

# Preview local (antes de deploy)
wrangler dev

# Parar preview
# Ctrl+C
```

## 📱 **URLS FINALES**
Después del despliegue tendrás:
- **Worker**: `https://printful-api-worker.your-username.workers.dev`
- **Health**: `https://printful-api-worker.your-username.workers.dev/api/health`
- **Productos**: `https://printful-api-worker.your-username.workers.dev/api/products`
- **Pedidos**: `https://printful-api-worker.your-username.workers.dev/api/orders`

## 🔧 **SOLUCIÓN DE PROBLEMAS**

### Si el comando `wrangler` no existe:
```bash
npm install -g wrangler
```

### Si hay error de permisos:
```bash
chmod 644 wrangler.toml printful-worker.js
```

### Verificar autenticación:
```bash
wrangler whoami
```

### Si necesitas re-deploy:
```bash
wrangler deploy --force
```

**¡Listo!** Estos son todos los comandos que necesitas ejecutar en Termux.