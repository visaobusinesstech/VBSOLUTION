#!/bin/bash

echo "🔄 Atualizando dados do WhatsApp com mensagens recentes..."

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

echo "🗑️ Limpando dados antigos..."

# Limpar dados antigos
curl -X DELETE "${SUPABASE_URL}/rest/v1/whatsapp_mensagens" \
  "${HEADERS[@]}" \
  -d '{"owner_id": "eq.00000000-0000-0000-0000-000000000000"}' \
  -s > /dev/null

curl -X DELETE "${SUPABASE_URL}/rest/v1/whatsapp_atendimentos" \
  "${HEADERS[@]}" \
  -d '{"owner_id": "eq.00000000-0000-0000-0000-000000000000"}' \
  -s > /dev/null

echo "✨ Inserindo conversas recentes..."

# Obter timestamp atual
CURRENT_TIME=$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)
RECENT_TIME_1=$(date -u -v-5M +%Y-%m-%dT%H:%M:%S.%3NZ)
RECENT_TIME_2=$(date -u -v-10M +%Y-%m-%dT%H:%M:%S.%3NZ)
RECENT_TIME_3=$(date -u -v-15M +%Y-%m-%dT%H:%M:%S.%3NZ)

# Inserir conversas recentes com IDs fixos
echo "📱 Inserindo conversa 1 - Maria Silva (Aguardando)..."
curl -X POST "${SUPABASE_URL}/rest/v1/whatsapp_atendimentos" \
  "${HEADERS[@]}" \
  -d "{
    \"id\": \"11111111-1111-1111-1111-111111111111\",
    \"owner_id\": \"00000000-0000-0000-0000-000000000000\",
    \"numero_cliente\": \"5511999887766\",
    \"nome_cliente\": \"Maria Silva\",
    \"status\": \"aguardando\",
    \"ultima_mensagem\": \"Olá! Preciso de ajuda com meu pedido\",
    \"ultima_mensagem_at\": \"$CURRENT_TIME\",
    \"created_at\": \"$CURRENT_TIME\",
    \"updated_at\": \"$CURRENT_TIME\"
  }" \
  -s > /dev/null

echo "📱 Inserindo conversa 2 - João Santos (Atendendo)..."
curl -X POST "${SUPABASE_URL}/rest/v1/whatsapp_atendimentos" \
  "${HEADERS[@]}" \
  -d "{
    \"id\": \"22222222-2222-2222-2222-222222222222\",
    \"owner_id\": \"00000000-0000-0000-0000-000000000000\",
    \"numero_cliente\": \"5511888776655\",
    \"nome_cliente\": \"João Santos\",
    \"status\": \"atendendo\",
    \"ultima_mensagem\": \"Problema resolvido! Obrigado pelo suporte\",
    \"ultima_mensagem_at\": \"$RECENT_TIME_1\",
    \"created_at\": \"$RECENT_TIME_1\",
    \"updated_at\": \"$RECENT_TIME_1\"
  }" \
  -s > /dev/null

echo "📱 Inserindo conversa 3 - Ana Costa (Aguardando)..."
curl -X POST "${SUPABASE_URL}/rest/v1/whatsapp_atendimentos" \
  "${HEADERS[@]}" \
  -d "{
    \"id\": \"33333333-3333-3333-3333-333333333333\",
    \"owner_id\": \"00000000-0000-0000-0000-000000000000\",
    \"numero_cliente\": \"5511777665544\",
    \"nome_cliente\": \"Ana Costa\",
    \"status\": \"aguardando\",
    \"ultima_mensagem\": \"Qual o preço do produto X?\",
    \"ultima_mensagem_at\": \"$RECENT_TIME_2\",
    \"created_at\": \"$RECENT_TIME_2\",
    \"updated_at\": \"$RECENT_TIME_2\"
  }" \
  -s > /dev/null

echo "📱 Inserindo conversa 4 - Carlos Oliveira (Finalizado)..."
curl -X POST "${SUPABASE_URL}/rest/v1/whatsapp_atendimentos" \
  "${HEADERS[@]}" \
  -d "{
    \"id\": \"44444444-4444-4444-4444-444444444444\",
    \"owner_id\": \"00000000-0000-0000-0000-000000000000\",
    \"numero_cliente\": \"5511666554433\",
    \"nome_cliente\": \"Carlos Oliveira\",
    \"status\": \"finalizado\",
    \"ultima_mensagem\": \"Obrigado! Atendimento excelente\",
    \"ultima_mensagem_at\": \"$RECENT_TIME_3\",
    \"created_at\": \"$RECENT_TIME_3\",
    \"updated_at\": \"$RECENT_TIME_3\"
  }" \
  -s > /dev/null

echo "💬 Inserindo mensagens recentes..."

# Inserir mensagens para cada conversa usando IDs fixos
echo "💬 Adicionando mensagens para Maria Silva..."
curl -X POST "${SUPABASE_URL}/rest/v1/whatsapp_mensagens" \
  "${HEADERS[@]}" \
  -d "{
    \"owner_id\": \"00000000-0000-0000-0000-000000000000\",
    \"atendimento_id\": \"11111111-1111-1111-1111-111111111111\",
    \"conteudo\": \"Olá! Preciso de ajuda com meu pedido\",
    \"tipo\": \"TEXTO\",
    \"direcao\": \"ENTRADA\",
    \"timestamp\": \"$CURRENT_TIME\"
  }" \
  -s > /dev/null

curl -X POST "${SUPABASE_URL}/rest/v1/whatsapp_mensagens" \
  "${HEADERS[@]}" \
  -d "{
    \"owner_id\": \"00000000-0000-0000-0000-000000000000\",
    \"atendimento_id\": \"11111111-1111-1111-1111-111111111111\",
    \"conteudo\": \"Claro! Como posso ajudá-la hoje?\",
    \"tipo\": \"TEXTO\",
    \"direcao\": \"SAIDA\",
    \"timestamp\": \"$CURRENT_TIME\"
  }" \
  -s > /dev/null

echo "💬 Adicionando mensagens para João Santos..."
curl -X POST "${SUPABASE_URL}/rest/v1/whatsapp_mensagens" \
  "${HEADERS[@]}" \
  -d "{
    \"owner_id\": \"00000000-0000-0000-0000-000000000000\",
    \"atendimento_id\": \"22222222-2222-2222-2222-222222222222\",
    \"conteudo\": \"Problema resolvido! Obrigado pelo suporte\",
    \"tipo\": \"TEXTO\",
    \"direcao\": \"ENTRADA\",
    \"timestamp\": \"$RECENT_TIME_1\"
  }" \
  -s > /dev/null

echo "💬 Adicionando mensagens para Ana Costa..."
curl -X POST "${SUPABASE_URL}/rest/v1/whatsapp_mensagens" \
  "${HEADERS[@]}" \
  -d "{
    \"owner_id\": \"00000000-0000-0000-0000-000000000000\",
    \"atendimento_id\": \"33333333-3333-3333-3333-333333333333\",
    \"conteudo\": \"Qual o preço do produto X?\",
    \"tipo\": \"TEXTO\",
    \"direcao\": \"ENTRADA\",
    \"timestamp\": \"$RECENT_TIME_2\"
  }" \
  -s > /dev/null

echo "💬 Adicionando mensagens para Carlos Oliveira..."
curl -X POST "${SUPABASE_URL}/rest/v1/whatsapp_mensagens" \
  "${HEADERS[@]}" \
  -d "{
    \"owner_id\": \"00000000-0000-0000-0000-000000000000\",
    \"atendimento_id\": \"44444444-4444-4444-4444-444444444444\",
    \"conteudo\": \"Obrigado! Atendimento excelente\",
    \"tipo\": \"TEXTO\",
    \"direcao\": \"ENTRADA\",
    \"timestamp\": \"$RECENT_TIME_3\"
  }" \
  -s > /dev/null

echo "✅ Dados atualizados com sucesso!"
echo "🔄 Recarregue a página para ver as conversas mais recentes."
echo ""
echo "📊 Resumo das conversas inseridas:"
echo "   • Maria Silva (Aguardando) - Mensagem mais recente"
echo "   • João Santos (Atendendo) - 5 minutos atrás"
echo "   • Ana Costa (Aguardando) - 10 minutos atrás"
echo "   • Carlos Oliveira (Finalizado) - 15 minutos atrás"
