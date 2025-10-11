#!/bin/bash

echo "🧪 TESTE DE NOMES DE CONTATOS - INICIANDO..."
echo "================================================"
echo ""

echo "📡 Verificando se os serviços estão rodando..."
echo "Backend (porta 3000):"
lsof -i :3000 | grep LISTEN || echo "❌ Backend não está rodando"

echo ""
echo "Frontend (porta 5174):"
lsof -i :5174 | grep LISTEN || echo "❌ Frontend não está rodando"

echo ""
echo "🔍 Monitorando logs do backend para nomes de contatos..."
echo "Pressione Ctrl+C para parar o monitoramento"
echo ""

# Monitorar logs do backend
tail -f backend/logs/server.log 2>/dev/null | grep -E "(DEBUG-NAMES|CONVERSATION-UPDATE|FRONTEND-NAMES)" --color=always || echo "Logs não encontrados, monitorando processo diretamente..."

echo ""
echo "✅ Teste concluído!"
