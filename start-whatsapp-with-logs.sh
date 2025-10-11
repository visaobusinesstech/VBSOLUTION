#!/bin/bash

# start-whatsapp-with-logs.sh
# Script para iniciar o backend WhatsApp com logs coloridos e detalhados

echo "🚀 Iniciando backend WhatsApp com logs detalhados..."
echo "📋 Logs importantes a observar:"
echo "   - [CONTACT-EXTRACTOR] - Extração de informações de contato"
echo "   - [BUSINESS-INFO] - Informações de negócio"
echo "   - [GROUP-INFO] - Informações de grupos"
echo "   - [DATABASE] - Salvamento no banco de dados"
echo "   - [PROFILE-SYNC] - Sincronização de perfis"
echo ""

# Navegar para o diretório do backend
cd backend

# Verificar se o arquivo existe
if [ ! -f "simple-baileys-server.js" ]; then
    echo "❌ Arquivo simple-baileys-server.js não encontrado!"
    echo "💡 Execute este script a partir do diretório raiz do projeto"
    exit 1
fi

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Definir variáveis de ambiente para logs coloridos
export NODE_ENV=development
export DEBUG=whatsapp:*
export FORCE_COLOR=1

# Iniciar o servidor com logs coloridos
echo "🔄 Iniciando servidor..."
echo "📡 Backend rodando em: http://localhost:3001"
echo "📊 Health check: http://localhost:3001/api/baileys-simple/health"
echo ""

# Usar node com cores e logs detalhados
node --trace-warnings simple-baileys-server.js 2>&1 | while IFS= read -r line; do
    # Colorir logs baseado no conteúdo
    if [[ $line == *"[CONTACT-EXTRACTOR]"* ]]; then
        echo -e "\033[36m$line\033[0m"  # Cyan
    elif [[ $line == *"[BUSINESS-INFO]"* ]]; then
        echo -e "\033[33m$line\033[0m"  # Yellow
    elif [[ $line == *"[GROUP-INFO]"* ]]; then
        echo -e "\033[35m$line\033[0m"  # Magenta
    elif [[ $line == *"[DATABASE]"* ]]; then
        echo -e "\033[32m$line\033[0m"  # Green
    elif [[ $line == *"[PROFILE-SYNC]"* ]]; then
        echo -e "\033[34m$line\033[0m"  # Blue
    elif [[ $line == *"✅"* ]]; then
        echo -e "\033[32m$line\033[0m"  # Green
    elif [[ $line == *"❌"* ]]; then
        echo -e "\033[31m$line\033[0m"  # Red
    elif [[ $line == *"⚠️"* ]]; then
        echo -e "\033[33m$line\033[0m"  # Yellow
    elif [[ $line == *"🔍"* ]]; then
        echo -e "\033[36m$line\033[0m"  # Cyan
    elif [[ $line == *"📨"* ]]; then
        echo -e "\033[37m$line\033[0m"  # White
    elif [[ $line == *"💾"* ]]; then
        echo -e "\033[32m$line\033[0m"  # Green
    elif [[ $line == *"📊"* ]]; then
        echo -e "\033[34m$line\033[0m"  # Blue
    else
        echo "$line"
    fi
done
