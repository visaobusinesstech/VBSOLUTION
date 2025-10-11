const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const SUPABASE_URL = 'https://nrbsocawokmihvxfcpso.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkFunnelStagesStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela funnel_stages...');

    // Buscar dados da tabela para ver quais colunas existem
    const { data: stages, error } = await supabase
      .from('funnel_stages')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Erro ao buscar dados:', error);
      return;
    }

    if (stages && stages.length > 0) {
      console.log('✅ Estrutura da tabela funnel_stages:');
      console.log('Colunas encontradas:', Object.keys(stages[0]));
      
      // Verificar se tem order_position ou position
      const hasOrderPosition = 'order_position' in stages[0];
      const hasPosition = 'position' in stages[0];
      
      console.log(`\n📊 Análise das colunas de ordenação:`);
      console.log(`- order_position: ${hasOrderPosition ? '✅ Existe' : '❌ Não existe'}`);
      console.log(`- position: ${hasPosition ? '✅ Existe' : '❌ Não existe'}`);
      
      if (hasOrderPosition) {
        console.log(`\n📝 Valor de order_position: ${stages[0].order_position}`);
      }
      if (hasPosition) {
        console.log(`\n📝 Valor de position: ${stages[0].position}`);
      }
    } else {
      console.log('⚠️ Nenhum dado encontrado na tabela funnel_stages');
    }

    // Buscar todas as etapas para ver a estrutura completa
    const { data: allStages, error: allError } = await supabase
      .from('funnel_stages')
      .select('*')
      .order('created_at');

    if (allError) {
      console.error('❌ Erro ao buscar todas as etapas:', allError);
    } else {
      console.log(`\n📋 Total de etapas encontradas: ${allStages?.length || 0}`);
      if (allStages && allStages.length > 0) {
        console.log('\n📝 Etapas:');
        allStages.forEach((stage, index) => {
          console.log(`${index + 1}. ${stage.name} (ID: ${stage.id})`);
          if (stage.order_position !== undefined) {
            console.log(`   - order_position: ${stage.order_position}`);
          }
          if (stage.position !== undefined) {
            console.log(`   - position: ${stage.position}`);
          }
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  checkFunnelStagesStructure();
}

module.exports = { checkFunnelStagesStructure };
