#!/bin/bash

# Script de Teste da Integração WhatsApp + Supabase
# VBSolution CRM

echo "🧪 Testando Integração WhatsApp + Supabase..."
echo "============================================="

# Verificar se o servidor está rodando
echo "🔍 Verificando se o servidor está rodando..."
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "❌ Servidor não está rodando na porta 3001."
    echo "🚀 Inicie o servidor primeiro com:"
    echo "   ./start-whatsapp-integration.sh"
    echo "   ou"
    echo "   npm run dev"
    exit 1
fi

echo "✅ Servidor está rodando."

# Verificar se o Node.js está disponível
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado."
    exit 1
fi

# Verificar se o axios está instalado
if ! node -e "require('axios')" 2>/dev/null; then
    echo "📦 Instalando axios para testes..."
    npm install axios uuid
fi

# Executar testes
echo "🧪 Executando testes..."
echo ""

node test-whatsapp-integration.js

echo ""
echo "✅ Testes concluídos!"
echo ""
echo "📋 Para mais informações, consulte:"
echo "   - Logs: tail -f logs/combined.log"
echo "   - Status: curl http://localhost:3001/api/whatsapp-bootstrap/status"
echo "   - Health: curl http://localhost:3001/health"
