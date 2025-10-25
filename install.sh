#!/bin/bash

# Script de instalación y despliegue para Printful Worker
# Ejecuta: bash install.sh

echo "🚀 Instalando Printful Worker..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar si wrangler está instalado
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ Error: npx no está instalado${NC}"
    echo "Instala Node.js primero: https://nodejs.org/"
    exit 1
fi

# Verificar si ya estamos autenticados
echo -e "${YELLOW}🔐 Verificando autenticación con Cloudflare...${NC}"
npx wrangler whoami > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  No autenticado. Iniciando login...${NC}"
    npx wrangler login
else
    echo -e "${GREEN}✅ Ya autenticado con Cloudflare${NC}"
fi

# Instalar dependencias
echo -e "${YELLOW}📦 Instalando dependencias...${NC}"
npm install

# Desplegar worker
echo -e "${YELLOW}🚀 Desplegando worker...${NC}"
npx wrangler deploy

# Verificar despliegue
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ ¡Worker desplegado exitosamente!${NC}"
    echo ""
    echo -e "${GREEN}🎉 Tu worker está listo en:${NC}"
    npx wrangler whoami > /dev/null 2>&1
    WORKER_NAME=$(npx wrangler whoami 2>/dev/null | grep "Account:" | awk '{print $2}')
    echo -e "${GREEN}https://printful-worker.$WORKER_NAME.workers.dev${NC}"
    echo ""
    echo -e "${YELLOW}📝 Pasos siguientes:${NC}"
    echo "1. Configura PRINTFUL_API_KEY en: Cloudflare Dashboard > Workers & Pages > Tu Worker > Settings > Variables"
    echo "2. Prueba el health check: curl https://printful-worker.$WORKER_NAME.workers.dev/api/health"
    echo "3. Abre test.html en tu navegador para probar desde la interfaz"
else
    echo -e "${RED}❌ Error en el despliegue${NC}"
    echo "Revisa los logs con: npx wrangler tail"
fi

echo ""
echo -e "${GREEN}🏁 Instalación completada${NC}"