const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase (mesmas do frontend)
const SUPABASE_URL = 'https://nrbsocawokmihvxfcpso.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFrontendConnection() {
  try {
    console.log('🧪 Testando conexão do frontend com Supabase...');

    // Testar conexão básica
    console.log('1. Testando conexão básica...');
    const { data: testData, error: testError } = await supabase
      .from('funnel_stages')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Erro na conexão básica:', testError);
      return;
    }
    console.log('✅ Conexão básica funcionando');

    // Testar busca de etapas (como o frontend faz)
    console.log('\n2. Testando busca de etapas...');
    const { data: stages, error: stagesError } = await supabase
      .from('funnel_stages')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true });

    if (stagesError) {
      console.error('❌ Erro ao buscar etapas:', stagesError);
      return;
    }

    console.log(`✅ Etapas encontradas: ${stages?.length || 0}`);
    
    if (stages && stages.length > 0) {
      console.log('\n📋 Etapas carregadas:');
      stages.forEach((stage, index) => {
        console.log(`${index + 1}. ${stage.name} (posição: ${stage.position})`);
      });
    }

    // Testar busca de leads
    console.log('\n3. Testando busca de leads...');
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .limit(5);

    if (leadsError) {
      console.error('❌ Erro ao buscar leads:', leadsError);
    } else {
      console.log(`✅ Leads encontrados: ${leads?.length || 0}`);
    }

    // Testar busca de pipelines
    console.log('\n4. Testando busca de pipelines...');
    const { data: pipelines, error: pipelinesError } = await supabase
      .from('pipelines')
      .select('*')
      .eq('is_active', true);

    if (pipelinesError) {
      console.error('❌ Erro ao buscar pipelines:', pipelinesError);
    } else {
      console.log(`✅ Pipelines encontradas: ${pipelines?.length || 0}`);
      if (pipelines && pipelines.length > 0) {
        pipelines.forEach(pipeline => {
          console.log(`   - ${pipeline.name} (padrão: ${pipeline.is_default ? 'Sim' : 'Não'})`);
        });
      }
    }

    console.log('\n🎉 Teste de conexão concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testFrontendConnection();
}

module.exports = { testFrontendConnection };
