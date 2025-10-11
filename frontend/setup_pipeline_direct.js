import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupPipelineDirect() {
  console.log('🚀 Configurando sistema de Pipeline diretamente no Supabase...');
  
  try {
    // 1. Verificar se a tabela pipeline_stages existe
    console.log('\n🔍 Verificando tabela pipeline_stages...');
    const { data: existingStages, error: stagesError } = await supabase
      .from('pipeline_stages')
      .select('*')
      .limit(1);
    
    if (stagesError) {
      console.log('❌ Tabela pipeline_stages não existe. Precisa ser criada manualmente no SQL Editor.');
    } else {
      console.log('✅ Tabela pipeline_stages já existe e está funcionando');
    }

    // 2. Verificar se a tabela pipelines existe
    console.log('\n🔍 Verificando tabela pipelines...');
    const { data: existingPipelines, error: pipelinesError } = await supabase
      .from('pipelines')
      .select('*')
      .limit(1);
    
    if (pipelinesError) {
      console.log('❌ Tabela pipelines não existe. Precisa ser criada manualmente no SQL Editor.');
    } else {
      console.log('✅ Tabela pipelines já existe e está funcionando');
    }

    // 3. Inserir pipeline padrão se não existir
    console.log('\n📝 Verificando pipeline padrão...');
    const { data: defaultPipeline, error: defaultPipelineError } = await supabase
      .from('pipelines')
      .select('*')
      .eq('is_default', true)
      .limit(1);
    
    if (defaultPipelineError) {
      console.log('❌ Erro ao verificar pipeline padrão:', defaultPipelineError.message);
    } else if (!defaultPipeline || defaultPipeline.length === 0) {
      console.log('📝 Inserindo pipeline padrão...');
      const { data: newPipeline, error: insertError } = await supabase
        .from('pipelines')
        .insert([{
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Pipeline Padrão',
          is_default: true
        }])
        .select();
      
      if (insertError) {
        console.log('❌ Erro ao inserir pipeline padrão:', insertError.message);
      } else {
        console.log('✅ Pipeline padrão criada com sucesso');
      }
    } else {
      console.log('✅ Pipeline padrão já existe');
    }

    // 4. Inserir etapas padrão se não existirem
    console.log('\n📝 Verificando etapas padrão...');
    const { data: existingDefaultStages, error: defaultStagesError } = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('pipeline_id', '00000000-0000-0000-0000-000000000001')
      .limit(1);
    
    if (defaultStagesError) {
      console.log('❌ Erro ao verificar etapas padrão:', defaultStagesError.message);
    } else if (!existingDefaultStages || existingDefaultStages.length === 0) {
      console.log('📝 Inserindo etapas padrão...');
      const defaultStages = [
        { id: '10000000-0000-0000-0000-000000000001', pipeline_id: '00000000-0000-0000-0000-000000000001', name: 'Novo Lead', position: 1, color: '#ef4444', is_active: true },
        { id: '10000000-0000-0000-0000-000000000002', pipeline_id: '00000000-0000-0000-0000-000000000001', name: 'Contato Inicial', position: 2, color: '#f59e0b', is_active: true },
        { id: '10000000-0000-0000-0000-000000000003', pipeline_id: '00000000-0000-0000-0000-000000000001', name: 'Proposta', position: 3, color: '#3b82f6', is_active: true },
        { id: '10000000-0000-0000-0000-000000000004', pipeline_id: '00000000-0000-0000-0000-000000000001', name: 'Reunião', position: 4, color: '#8b5cf6', is_active: true },
        { id: '10000000-0000-0000-0000-000000000005', pipeline_id: '00000000-0000-0000-0000-000000000001', name: 'Fechamento', position: 5, color: '#10b981', is_active: true }
      ];
      
      const { data: newStages, error: insertStagesError } = await supabase
        .from('pipeline_stages')
        .insert(defaultStages)
        .select();
      
      if (insertStagesError) {
        console.log('❌ Erro ao inserir etapas padrão:', insertStagesError.message);
      } else {
        console.log('✅ Etapas padrão criadas com sucesso');
      }
    } else {
      console.log('✅ Etapas padrão já existem');
    }

    // 5. Verificar se a coluna stage_id existe na tabela leads
    console.log('\n🔍 Verificando coluna stage_id na tabela leads...');
    const { data: leadsTest, error: leadsError } = await supabase
      .from('leads')
      .select('stage_id')
      .limit(1);
    
    if (leadsError && leadsError.message.includes('column "stage_id" does not exist')) {
      console.log('❌ Coluna stage_id não existe na tabela leads. Precisa ser adicionada manualmente no SQL Editor.');
    } else if (leadsError) {
      console.log('⚠️ Erro ao verificar coluna stage_id:', leadsError.message);
    } else {
      console.log('✅ Coluna stage_id existe na tabela leads');
    }

    // 6. Teste final - buscar etapas
    console.log('\n🧪 Teste final - buscando etapas...');
    const { data: allStages, error: finalError } = await supabase
      .from('pipeline_stages')
      .select('*')
      .order('position', { ascending: true });
    
    if (finalError) {
      console.log('❌ Erro no teste final:', finalError.message);
    } else {
      console.log('✅ Teste final bem-sucedido!');
      console.log(`📊 Encontradas ${allStages.length} etapas:`);
      allStages.forEach(stage => {
        console.log(`   - ${stage.position}. ${stage.name} (${stage.color})`);
      });
    }

    console.log('\n🎉 Configuração concluída!');
    console.log('\n📋 Status do sistema:');
    console.log('✅ Conexão com Supabase: OK');
    console.log('✅ Cliente configurado: OK');
    
    if (existingPipelines && !pipelinesError) {
      console.log('✅ Tabela pipelines: OK');
    } else {
      console.log('❌ Tabela pipelines: Precisa ser criada');
    }
    
    if (existingStages && !stagesError) {
      console.log('✅ Tabela pipeline_stages: OK');
    } else {
      console.log('❌ Tabela pipeline_stages: Precisa ser criada');
    }
    
    if (allStages && !finalError) {
      console.log('✅ Etapas padrão: OK');
    } else {
      console.log('❌ Etapas padrão: Precisa ser criada');
    }

    console.log('\n📝 Se alguma tabela precisar ser criada, execute o seguinte SQL no Supabase SQL Editor:');
    console.log(`
-- Criar tabela pipelines
CREATE TABLE IF NOT EXISTS pipelines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    company_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela pipeline_stages
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    position INTEGER NOT NULL,
    color VARCHAR(7) DEFAULT '#3b82f6',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar colunas na tabela leads
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES pipelines(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL;

-- Inserir pipeline padrão
INSERT INTO pipelines (id, name, is_default) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Pipeline Padrão', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Inserir etapas padrão
INSERT INTO pipeline_stages (id, pipeline_id, name, position, color, is_active) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Novo Lead', 1, '#ef4444', TRUE),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Contato Inicial', 2, '#f59e0b', TRUE),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Proposta', 3, '#3b82f6', TRUE),
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Reunião', 4, '#8b5cf6', TRUE),
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Fechamento', 5, '#10b981', TRUE)
ON CONFLICT (id) DO NOTHING;
    `);
    
  } catch (error) {
    console.error('❌ Erro geral na configuração:', error);
  }
}

// Executar a função
setupPipelineDirect();

