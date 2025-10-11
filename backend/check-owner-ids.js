#!/usr/bin/env node

/**
 * Verificar Owner IDs no Supabase
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase conectado');
} catch (error) {
  console.error('❌ Erro ao conectar com Supabase:', error.message);
  process.exit(1);
}

async function checkOwnerIds() {
  console.log('🔍 Verificando Owner IDs no Supabase...\n');

  try {
    // Buscar todos os owner_ids únicos
    const { data: atendimentos, error } = await supabase
      .from('whatsapp_atendimentos')
      .select('owner_id')
      .not('owner_id', 'is', null);

    if (error) {
      throw new Error(`Erro ao buscar owner_ids: ${error.message}`);
    }

    const uniqueOwnerIds = [...new Set(atendimentos.map(a => a.owner_id))];
    
    console.log(`✅ Owner IDs encontrados: ${uniqueOwnerIds.length}`);
    uniqueOwnerIds.forEach((id, index) => {
      console.log(`   ${index + 1}. ${id}`);
    });

    // Buscar conversas para cada owner_id
    console.log('\n📊 Conversas por Owner ID:');
    for (const ownerId of uniqueOwnerIds) {
      const { data: convs, error: convError } = await supabase
        .from('whatsapp_atendimentos')
        .select('id, numero_cliente, nome_cliente, status')
        .eq('owner_id', ownerId)
        .limit(5);

      if (!convError && convs) {
        console.log(`\n   Owner ID: ${ownerId}`);
        console.log(`   Conversas: ${convs.length}`);
        convs.forEach(conv => {
          console.log(`     - ${conv.nome_cliente || conv.numero_cliente} (${conv.status})`);
        });
      }
    }

    return uniqueOwnerIds;
  } catch (error) {
    console.error('❌ Erro:', error.message);
    return [];
  }
}

async function runCheck() {
  const ownerIds = await checkOwnerIds();
  
  if (ownerIds.length > 0) {
    console.log('\n🎯 Solução:');
    console.log('1. Use um dos Owner IDs encontrados acima');
    console.log('2. Ou atualize o frontend para usar o Owner ID correto');
    console.log('3. Ou crie dados de teste com o Owner ID do frontend');
  }
}

runCheck().catch(console.error);
