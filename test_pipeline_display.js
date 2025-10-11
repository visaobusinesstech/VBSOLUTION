const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const SUPABASE_URL = 'https://nrbsocawokmihvxfcpso.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testPipelineDisplay() {
  try {
    console.log('🧪 Testando exibição da pipeline...');

    // Buscar pipeline padrão
    const { data: defaultPipeline, error: pipelineError } = await supabase
      .from('pipelines')
      .select('id, name, is_default')
      .eq('is_default', true)
      .single();

    if (pipelineError || !defaultPipeline) {
      console.error('❌ Erro ao buscar pipeline padrão:', pipelineError);
      return;
    }

    console.log('✅ Pipeline padrão encontrada:', defaultPipeline.name);

    // Buscar etapas da pipeline padrão
    const { data: stages, error: stagesError } = await supabase
      .from('funnel_stages')
      .select('*')
      .eq('pipeline_id', defaultPipeline.id)
      .eq('is_active', true)
      .order('position', { ascending: true });

    if (stagesError) {
      console.error('❌ Erro ao buscar etapas:', stagesError);
      return;
    }

    console.log(`\n📋 Etapas da pipeline "${defaultPipeline.name}":`);
    console.log('=' .repeat(50));
    
    if (stages && stages.length > 0) {
      stages.forEach((stage, index) => {
        console.log(`${index + 1}. ${stage.name}`);
        console.log(`   - ID: ${stage.id}`);
        console.log(`   - Posição: ${stage.position}`);
        console.log(`   - Cor: ${stage.color}`);
        console.log(`   - Ativa: ${stage.is_active ? 'Sim' : 'Não'}`);
        console.log(`   - Criada em: ${new Date(stage.created_at).toLocaleString('pt-BR')}`);
        console.log('');
      });
    } else {
      console.log('⚠️ Nenhuma etapa encontrada na pipeline padrão');
    }

    // Verificar se as etapas estão na ordem correta
    const expectedStages = ['Novo Lead', 'Contato Inicial', 'Proposta', 'Reunião', 'Fechamento'];
    const actualStages = stages?.map(s => s.name) || [];
    
    console.log('🔍 Verificando ordem das etapas:');
    console.log('Esperado:', expectedStages.join(' → '));
    console.log('Atual:   ', actualStages.join(' → '));
    
    const isCorrectOrder = JSON.stringify(expectedStages) === JSON.stringify(actualStages);
    console.log(`✅ Ordem correta: ${isCorrectOrder ? 'Sim' : 'Não'}`);

    console.log('\n🎉 Teste concluído!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testPipelineDisplay();
}

module.exports = { testPipelineDisplay };
