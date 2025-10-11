const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const SUPABASE_URL = 'https://nrbsocawokmihvxfcpso.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkStagesPipelineAssociation() {
  try {
    console.log('🔍 Verificando associação das etapas com pipelines...');

    // Buscar pipeline padrão
    const { data: defaultPipeline, error: pipelineError } = await supabase
      .from('pipelines')
      .select('*')
      .eq('is_default', true)
      .single();

    if (pipelineError || !defaultPipeline) {
      console.error('❌ Erro ao buscar pipeline padrão:', pipelineError);
      return;
    }

    console.log('✅ Pipeline padrão encontrada:', defaultPipeline);

    // Buscar todas as etapas
    const { data: allStages, error: allStagesError } = await supabase
      .from('funnel_stages')
      .select('*')
      .order('position', { ascending: true });

    if (allStagesError) {
      console.error('❌ Erro ao buscar todas as etapas:', allStagesError);
      return;
    }

    console.log(`\n📋 Todas as etapas encontradas: ${allStages?.length || 0}`);
    if (allStages && allStages.length > 0) {
      allStages.forEach(stage => {
        console.log(`   - ${stage.name} (pipeline_id: ${stage.pipeline_id})`);
      });
    }

    // Buscar etapas da pipeline padrão
    const { data: pipelineStages, error: pipelineStagesError } = await supabase
      .from('funnel_stages')
      .select('*')
      .eq('pipeline_id', defaultPipeline.id)
      .order('position', { ascending: true });

    if (pipelineStagesError) {
      console.error('❌ Erro ao buscar etapas da pipeline padrão:', pipelineStagesError);
    } else {
      console.log(`\n📋 Etapas da pipeline padrão: ${pipelineStages?.length || 0}`);
      if (pipelineStages && pipelineStages.length > 0) {
        pipelineStages.forEach(stage => {
          console.log(`   - ${stage.name} (posição: ${stage.position})`);
        });
      }
    }

    // Verificar se há etapas sem pipeline_id
    const stagesWithoutPipeline = allStages?.filter(stage => !stage.pipeline_id) || [];
    if (stagesWithoutPipeline.length > 0) {
      console.log(`\n⚠️ Etapas sem pipeline_id: ${stagesWithoutPipeline.length}`);
      stagesWithoutPipeline.forEach(stage => {
        console.log(`   - ${stage.name} (ID: ${stage.id})`);
      });
    }

    // Atualizar etapas sem pipeline_id para a pipeline padrão
    if (stagesWithoutPipeline.length > 0) {
      console.log('\n🔧 Atualizando etapas sem pipeline_id...');
      for (const stage of stagesWithoutPipeline) {
        const { error: updateError } = await supabase
          .from('funnel_stages')
          .update({ pipeline_id: defaultPipeline.id })
          .eq('id', stage.id);

        if (updateError) {
          console.error(`❌ Erro ao atualizar etapa ${stage.name}:`, updateError);
        } else {
          console.log(`✅ Etapa ${stage.name} atualizada`);
        }
      }
    }

    // Testar novamente com chave anônima
    console.log('\n🧪 Testando novamente com chave anônima...');
    const { createClient: createAnonClient } = require('@supabase/supabase-js');
    const supabaseAnon = createAnonClient(SUPABASE_URL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0');

    const { data: anonStages, error: anonError } = await supabaseAnon
      .from('funnel_stages')
      .select('*')
      .order('position', { ascending: true });

    if (anonError) {
      console.error('❌ Erro com chave anônima:', anonError);
    } else {
      console.log(`✅ Etapas acessíveis com chave anônima: ${anonStages?.length || 0}`);
      if (anonStages && anonStages.length > 0) {
        anonStages.forEach(stage => {
          console.log(`   - ${stage.name} (posição: ${stage.position})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  checkStagesPipelineAssociation();
}

module.exports = { checkStagesPipelineAssociation };
