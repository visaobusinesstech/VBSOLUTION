#!/usr/bin/env node

/**
 * Supabase Watcher - Observa mudanças em tempo real no Supabase
 * Executa apenas quando FEATURE_WHATSAPP_STRICT_OBSERVE=true
 */

import { createClient } from '@supabase/supabase-js';

// Verificar se o modo de observação está ativo
if (process.env.FEATURE_WHATSAPP_STRICT_OBSERVE !== 'true') {
  console.log('Modo de observação não ativo. Defina FEATURE_WHATSAPP_STRICT_OBSERVE=true');
  process.exit(0);
}

const supabaseUrl = process.env.SUPABASE_URL || 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Iniciando observação do Supabase...');
console.log('📡 Aguardando mudanças em tempo real...\n');

// Função para formatar dados de forma compacta
function formatRowData(table: string, data: any) {
  const keys = Object.keys(data).slice(0, 5); // Primeiros 5 campos
  const keyValues = keys.map(key => `${key}=${data[key]}`).join(', ');
  return `{table:"${table}", ${keyValues}...}`;
}

// Observar whatsapp_mensagens
const mensagensChannel = supabase
  .channel('whatsapp-mensagens-observer')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'whatsapp_mensagens'
    },
    (payload) => {
      console.log(`supabase_row_insert ${formatRowData('whatsapp_mensagens', payload.new)}`);
    }
  )
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'whatsapp_mensagens'
    },
    (payload) => {
      console.log(`supabase_row_update ${formatRowData('whatsapp_mensagens', payload.new)}`);
    }
  )
  .subscribe();

// Observar whatsapp_atendimentos
const atendimentosChannel = supabase
  .channel('whatsapp-atendimentos-observer')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'whatsapp_atendimentos'
    },
    (payload) => {
      console.log(`supabase_row_insert ${formatRowData('whatsapp_atendimentos', payload.new)}`);
    }
  )
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'whatsapp_atendimentos'
    },
    (payload) => {
      console.log(`supabase_row_update ${formatRowData('whatsapp_atendimentos', payload.new)}`);
    }
  )
  .subscribe();

// Observar whatsapp_sessions
const sessionsChannel = supabase
  .channel('whatsapp-sessions-observer')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'whatsapp_sessions'
    },
    (payload) => {
      console.log(`supabase_row_insert ${formatRowData('whatsapp_sessions', payload.new)}`);
    }
  )
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'whatsapp_sessions'
    },
    (payload) => {
      console.log(`supabase_row_update ${formatRowData('whatsapp_sessions', payload.new)}`);
    }
  )
  .subscribe();

// Verificar status das subscrições
setTimeout(() => {
  console.log('✅ Subscrições ativas:');
  console.log('   - whatsapp_mensagens (INSERT/UPDATE)');
  console.log('   - whatsapp_atendimentos (INSERT/UPDATE)');
  console.log('   - whatsapp_sessions (INSERT/UPDATE)');
  console.log('\n📱 Envie mensagens do seu telefone para ver as mudanças em tempo real!\n');
}, 2000);

// Manter o script rodando
process.on('SIGINT', async () => {
  console.log('\n🛑 Parando observação...');
  await supabase.removeChannel(mensagensChannel);
  await supabase.removeChannel(atendimentosChannel);
  await supabase.removeChannel(sessionsChannel);
  process.exit(0);
});

// Manter vivo
setInterval(() => {
  // Heartbeat silencioso
}, 30000);
