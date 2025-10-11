#!/bin/bash

# Script de Inicialização Automática VBSolutionCRM com Baileys
# Este script garante que o Baileys seja sempre inicializado automaticamente

echo "🚀 Inicializando VBSolutionCRM com Baileys Automático..."

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado!"
    echo "   Instale o Node.js em: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ NPM não está instalado!"
    exit 1
fi

echo "✅ NPM encontrado: $(npm --version)"

# Instalar dependências se necessário
echo "📦 Verificando dependências..."
npm run install:all

# Iniciar o sistema completo com Baileys
echo "🚀 Iniciando sistema completo com Baileys..."
npm run start:auto
