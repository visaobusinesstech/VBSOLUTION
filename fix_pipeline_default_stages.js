const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const SUPABASE_URL = 'https://nrbsocawokmihvxfcpso.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixPipelineDefaultStages() {
  try {
    console.log('🔧 Corrigindo etapas da pipeline padrão...');

    // Definir as etapas padrão com suas posições e cores corretas
    const defaultStages = [
      { name: 'Novo Lead', position: 1, color: '#ef4444' },
      { name: 'Contato Inicial', position: 2, color: '#f59e0b' },
      { name: 'Proposta', position: 3, color: '#3b82f6' },
      { name: 'Reunião', position: 4, color: '#8b5cf6' },
      { name: 'Fechamento', position: 5, color: '#10b981' }
    ];

    // Buscar pipeline padrão
    const { data: defaultPipeline, error: pipelineError } = await supabase
      .from('pipelines')
      .select('id')
      .eq('is_default', true)
      .single();

    if (pipelineError || !defaultPipeline) {
      console.error('❌ Erro ao buscar pipeline padrão:', pipelineError);
      return;
    }

    console.log('✅ Pipeline padrão encontrada:', defaultPipeline.id);

    // Atualizar cada etapa
    for (const stage of defaultStages) {
      const { error: updateError } = await supabase
        .from('funnel_stages')
      .update({
        position: stage.position,
        color: stage.color,
        pipeline_id: defaultPipeline.id,
        is_active: true
      })
        .eq('name', stage.name);

      if (updateError) {
        console.error(`❌ Erro ao atualizar etapa ${stage.name}:`, updateError);
      } else {
        console.log(`✅ Etapa ${stage.name} atualizada (posição: ${stage.position})`);
      }
    }

    // Verificar resultado
    const { data: updatedStages, error: checkError } = await supabase
      .from('funnel_stages')
      .select('name, position, color, pipeline_id')
      .eq('pipeline_id', defaultPipeline.id)
      .order('position');

    if (checkError) {
      console.error('❌ Erro ao verificar etapas:', checkError);
    } else {
      console.log('\n📋 Etapas atualizadas:');
      updatedStages?.forEach(stage => {
        console.log(`${stage.position}. ${stage.name} (${stage.color})`);
      });
    }

    console.log('\n🎉 Pipeline padrão corrigida com sucesso!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  fixPipelineDefaultStages();
}

module.exports = { fixPipelineDefaultStages };
