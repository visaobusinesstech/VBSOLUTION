const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const SUPABASE_URL = 'https://nrbsocawokmihvxfcpso.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAnonKeyDirect() {
  try {
    console.log('🧪 Testando chave anônima diretamente...');

    // Testar busca simples
    console.log('1. Testando busca simples...');
    const { data: simpleData, error: simpleError } = await supabase
      .from('funnel_stages')
      .select('*')
      .limit(5);

    if (simpleError) {
      console.error('❌ Erro na busca simples:', simpleError);
    } else {
      console.log(`✅ Busca simples funcionou: ${simpleData?.length || 0} registros`);
    }

    // Testar busca com ordenação
    console.log('\n2. Testando busca com ordenação...');
    const { data: orderedData, error: orderedError } = await supabase
      .from('funnel_stages')
      .select('*')
      .order('position', { ascending: true });

    if (orderedError) {
      console.error('❌ Erro na busca ordenada:', orderedError);
    } else {
      console.log(`✅ Busca ordenada funcionou: ${orderedData?.length || 0} registros`);
      if (orderedData && orderedData.length > 0) {
        orderedData.forEach(stage => {
          console.log(`   - ${stage.name} (posição: ${stage.position})`);
        });
      }
    }

    // Testar busca com filtro
    console.log('\n3. Testando busca com filtro is_active...');
    const { data: filteredData, error: filteredError } = await supabase
      .from('funnel_stages')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true });

    if (filteredError) {
      console.error('❌ Erro na busca filtrada:', filteredError);
    } else {
      console.log(`✅ Busca filtrada funcionou: ${filteredData?.length || 0} registros`);
    }

    // Testar busca de pipelines
    console.log('\n4. Testando busca de pipelines...');
    const { data: pipelinesData, error: pipelinesError } = await supabase
      .from('pipelines')
      .select('*')
      .eq('is_active', true);

    if (pipelinesError) {
      console.error('❌ Erro na busca de pipelines:', pipelinesError);
    } else {
      console.log(`✅ Busca de pipelines funcionou: ${pipelinesData?.length || 0} registros`);
    }

    // Testar busca de leads
    console.log('\n5. Testando busca de leads...');
    const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .limit(5);

    if (leadsError) {
      console.error('❌ Erro na busca de leads:', leadsError);
    } else {
      console.log(`✅ Busca de leads funcionou: ${leadsData?.length || 0} registros`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testAnonKeyDirect();
}

module.exports = { testAnonKeyDirect };
