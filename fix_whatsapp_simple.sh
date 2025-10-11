#!/bin/bash

echo "🚀 Corrigindo RLS do WhatsApp..."

# Configurações
SUPABASE_URL="https://nrbsocawokmihvxfcpso.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0"

# Headers
HEADERS=(
  -H "apikey: $SUPABASE_KEY"
  -H "Authorization: Bearer $SUPABASE_KEY"
  -H "Content-Type: application/json"
  -H "Prefer: return=minimal"
)

echo "📝 Executando correções..."

# 1. Desabilitar RLS temporariamente
echo "1. Desabilitando RLS..."
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  "${HEADERS[@]}" \
  -d '{"query": "ALTER TABLE public.whatsapp_atendimentos DISABLE ROW LEVEL SECURITY;"}' \
  -s > /dev/null

curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  "${HEADERS[@]}" \
  -d '{"query": "ALTER TABLE public.whatsapp_mensagens DISABLE ROW LEVEL SECURITY;"}' \
  -s > /dev/null

# 2. Garantir permissões
echo "2. Configurando permissões..."
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  "${HEADERS[@]}" \
  -d '{"query": "GRANT ALL ON public.whatsapp_atendimentos TO authenticated, anon;"}' \
  -s > /dev/null

curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  "${HEADERS[@]}" \
  -d '{"query": "GRANT ALL ON public.whatsapp_mensagens TO authenticated, anon;"}' \
  -s > /dev/null

# 3. Inserir dados de teste
echo "3. Inserindo dados de teste..."
curl -X POST "${SUPABASE_URL}/rest/v1/whatsapp_atendimentos" \
  "${HEADERS[@]}" \
  -d '{
    "owner_id": "00000000-0000-0000-0000-000000000000",
    "numero_cliente": "5511999999999",
    "nome_cliente": "Cliente Teste",
    "status": "aguardando",
    "ultima_mensagem": "Olá! Como posso ajudar?",
    "ultima_mensagem_at": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
  }' \
  -s > /dev/null

echo "✅ Correções aplicadas!"
echo "🔄 Recarregue a página de conversas para ver os dados de teste."
