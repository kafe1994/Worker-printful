#!/bin/bash

# ============================================================================
# INSTALL SCRIPT PARA PRINTFUL CLOUDFLARE WORKER
# ============================================================================
# 
# Este script automatiza la configuración del worker en Termux
# 
# Uso:
# bash install.sh
# 

set -e  # Salir en caso de error

echo "🚀 Instalador de Printful Cloudflare Worker"
echo "=============================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estamos en Termux/Android
if [[ "$(uname -a)" != *"Android"* ]]; then
    print_warning "Este script está optimizado para Termux en Android"
    print_warning "Continúa bajo tu propio riesgo"
    echo ""
fi

# Verificar Node.js
print_status "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado"
    print_status "Instala Node.js en Termux:"
    print_status "  pkg install nodejs"
    exit 1
fi
print_success "Node.js $(node --version) encontrado"

# Verificar npm
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado"
    exit 1
fi
print_success "npm $(npm --version) encontrado"

# Verificar wrangler
print_status "Verificando Wrangler..."
if ! command -v wrangler &> /dev/null; then
    print_warning "Wrangler no encontrado, instalando..."
    npm install -g wrangler
    print_success "Wrangler instalado"
else
    print_success "Wrangler $(wrangler --version) encontrado"
fi

# Crear directorio del proyecto
PROJECT_NAME="printful-worker"
if [ -d "$PROJECT_NAME" ]; then
    print_warning "El directorio $PROJECT_NAME ya existe"
    read -p "¿Quieres continuar? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Instalación cancelada"
        exit 0
    fi
else
    print_status "Creando directorio del proyecto..."
    mkdir -p $PROJECT_NAME
    cd $PROJECT_NAME
    print_success "Directorio $PROJECT_NAME creado"
fi

# Inicializar package.json si no existe
if [ ! -f "package.json" ]; then
    print_status "Inicializando proyecto Node.js..."
    cat > package.json << EOF
{
  "name": "printful-cloudflare-worker",
  "version": "1.0.0",
  "description": "Cloudflare Worker proxy para la API de Printful",
  "main": "printful-worker.js",
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "preview": "wrangler dev --preview"
  },
  "keywords": ["cloudflare", "workers", "printful", "api"],
  "author": "Desarrollador",
  "license": "MIT"
}
EOF
    print_success "package.json creado"
fi

# Instalar dependencias
print_status "Instalando dependencias..."
npm install
print_success "Dependencias instaladas"

# Crear archivos de configuración si no existen
print_status "Creando archivos de configuración..."

# wrangler.toml
if [ ! -f "wrangler.toml" ]; then
    cat > wrangler.toml << EOF
name = "printful-api-worker"
main = "printful-worker.js"
compatibility_date = "2024-01-01"

[env.production]
name = "printful-api-worker"

[env.development]
name = "printful-api-worker-dev"
EOF
    print_success "wrangler.toml creado"
fi

# .gitignore
if [ ! -f ".gitignore" ]; then
    cat > .gitignore << EOF
.wrangler/
.wrangler/state/
node_modules/
.env
.DS_Store
*.log
EOF
    print_success ".gitignore creado"
fi

# Crear worker placeholder si no existe
if [ ! -f "printful-worker.js" ]; then
    print_warning "Debes copiar manualmente el código del worker"
    print_status "Busca el archivo printful-worker.js en el directorio del proyecto"
fi

print_success "Configuración básica completada"
echo ""

# Autenticación con Cloudflare
print_status "Configurando autenticación con Cloudflare..."
if ! wrangler whoami &> /dev/null; then
    print_status "Inicia sesión en Cloudflare..."
    wrangler login
    if [ $? -eq 0 ]; then
        print_success "Autenticación exitosa"
    else
        print_error "Error en la autenticación"
        exit 1
    fi
else
    print_success "Ya autenticado con Cloudflare"
fi

# Mostrar resumen
echo ""
echo "🎉 ¡Instalación completada!"
echo "=========================="
echo ""
print_success "Proyecto configurado en: $(pwd)"
print_status "Siguientes pasos:"
echo ""
echo "1. 🛠️  COPIA EL CÓDIGO DEL WORKER:"
echo "   - Copia el contenido del archivo 'printful-worker.js'"
echo "   - Pégalo en el archivo 'printful-worker.js' del proyecto"
echo ""
echo "2. 🚀 DESPLIEGA EL WORKER:"
echo "   wrangler deploy"
echo ""
echo "3. ⚙️  CONFIGURA LA API KEY:"
echo "   - Ve al dashboard de Cloudflare Workers"
echo "   - Busca tu worker 'printful-api-worker'"
echo "   - Settings → Variables → Add Variable"
echo "   - Name: PRINTFUL_API_KEY"
echo "   - Type: Encrypt"
echo "   - Value: [tu_api_key_de_printful]"
echo ""
echo "4. 🧪 PRUEBA EL WORKER:"
echo "   curl https://printful-api-worker.your-username.workers.dev/api/health"
echo ""
echo "📚 RECURSOS ÚTILES:"
echo "   - Documentación: README_GITHUB.md"
echo "   - Ejemplos: ejemplos-practicos.js"
echo "   - Health check: /api/health"
echo "   - Info API: /api"
echo ""

# Comandos adicionales
echo "🔧 COMANDOS ÚTILES:"
echo "   wrangler dev          # Desarrollo local"
echo "   wrangler tail         # Ver logs en tiempo real"
echo "   wrangler whoami       # Ver info de cuenta"
echo ""

print_success "¡Listo para usar! 🚀"