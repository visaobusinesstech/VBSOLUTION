// Script para testar o sistema de pipeline após a configuração
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nrbsocawokmihvxfcpso.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testPipelineSystem() {
  console.log('🧪 Testando sistema de Pipeline de Leads...\n');

  let allTestsPassed = true;

  // Teste 1: Verificar conexão com Supabase
  console.log('1️⃣ Testando conexão com Supabase...');
  try {
    const { data, error } = await supabase.from('pipelines').select('count').limit(1);
    if (error) {
      console.log('❌ Falha na conexão:', error.message);
      allTestsPassed = false;
    } else {
      console.log('✅ Conexão com Supabase: OK');
    }
  } catch (err) {
    console.log('❌ Erro de conexão:', err.message);
    allTestsPassed = false;
  }

  // Teste 2: Verificar tabela pipelines
  console.log('\n2️⃣ Testando tabela pipelines...');
  try {
    const { data: pipelines, error } = await supabase
      .from('pipelines')
      .select('*')
      .limit(5);

    if (error) {
      console.log('❌ Erro na tabela pipelines:', error.message);
      allTestsPassed = false;
    } else {
      console.log('✅ Tabela pipelines: OK');
      console.log(`📊 Pipelines encontradas: ${pipelines.length}`);
      if (pipelines.length > 0) {
        console.log('📝 Pipeline padrão:', pipelines[0].name);
      }
    }
  } catch (err) {
    console.log('❌ Erro ao testar pipelines:', err.message);
    allTestsPassed = false;
  }

  // Teste 3: Verificar tabela pipeline_stages
  console.log('\n3️⃣ Testando tabela pipeline_stages...');
  try {
    const { data: stages, error } = await supabase
      .from('pipeline_stages')
      .select('*')
      .order('position', { ascending: true });

    if (error) {
      console.log('❌ Erro na tabela pipeline_stages:', error.message);
      console.log('📝 Esta tabela precisa ser criada manualmente no SQL Editor');
      allTestsPassed = false;
    } else {
      console.log('✅ Tabela pipeline_stages: OK');
      console.log(`📊 Etapas encontradas: ${stages.length}`);
      
      if (stages.length > 0) {
        console.log('\n🎯 Etapas da pipeline:');
        stages.forEach(stage => {
          console.log(`   ${stage.position}. ${stage.name} (${stage.color})`);
        });
      } else {
        console.log('⚠️ Nenhuma etapa encontrada');
        allTestsPassed = false;
      }
    }
  } catch (err) {
    console.log('❌ Erro ao testar pipeline_stages:', err.message);
    allTestsPassed = false;
  }

  // Teste 4: Verificar tabela leads
  console.log('\n4️⃣ Testando tabela leads...');
  try {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, name, stage_id, pipeline_id')
      .limit(5);

    if (error) {
      console.log('❌ Erro na tabela leads:', error.message);
      allTestsPassed = false;
    } else {
      console.log('✅ Tabela leads: OK');
      console.log(`📊 Leads encontrados: ${leads.length}`);
      
      if (leads.length > 0) {
        console.log('📝 Exemplo de lead:', leads[0].name);
      }
    }
  } catch (err) {
    console.log('❌ Erro ao testar leads:', err.message);
    allTestsPassed = false;
  }

  // Teste 5: Verificar colunas stage_id e pipeline_id na tabela leads
  console.log('\n5️⃣ Testando colunas stage_id e pipeline_id...');
  try {
    const { data: leadsWithStages, error } = await supabase
      .from('leads')
      .select('id, name, stage_id, pipeline_id')
      .not('stage_id', 'is', null)
      .limit(1);

    if (error && error.message.includes('column "stage_id" does not exist')) {
      console.log('❌ Coluna stage_id não existe na tabela leads');
      console.log('📝 Execute: ALTER TABLE leads ADD COLUMN stage_id UUID;');
      allTestsPassed = false;
    } else if (error) {
      console.log('⚠️ Erro ao verificar stage_id:', error.message);
    } else {
      console.log('✅ Colunas stage_id e pipeline_id: OK');
    }
  } catch (err) {
    console.log('❌ Erro ao testar colunas:', err.message);
    allTestsPassed = false;
  }

  // Resultado final
  console.log('\n' + '='.repeat(60));
  console.log('📋 RESULTADO FINAL DOS TESTES');
  console.log('='.repeat(60));

  if (allTestsPassed) {
    console.log('🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ Sistema de Pipeline está funcionando perfeitamente!');
    console.log('✅ Página Leads e Vendas está pronta para uso!');
    console.log('\n🚀 Próximos passos:');
    console.log('1. Acesse a página Leads e Vendas no sistema');
    console.log('2. Use o botão "Novo Lead" para criar leads');
    console.log('3. Use o botão "Editar" para personalizar etapas');
    console.log('4. Arraste cards entre etapas para mover leads');
  } else {
    console.log('⚠️ ALGUNS TESTES FALHARAM');
    console.log('❌ Sistema precisa de configuração adicional');
    console.log('\n🔧 AÇÕES NECESSÁRIAS:');
    console.log('1. Execute o SQL no Supabase SQL Editor');
    console.log('2. Execute novamente: node test_pipeline_system.js');
    console.log('3. Verifique se todos os testes passam');
    
    console.log('\n📝 SQL para executar no Supabase:');
    console.log(`
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

-- Inserir etapas padrão
INSERT INTO pipeline_stages (id, pipeline_id, name, position, color, is_active) VALUES
('10000000-0000-0000-0000-000000000001', 'f3eec962-47e7-49cb-8d5d-40a719494e18', 'Novo Lead', 1, '#ef4444', TRUE),
('10000000-0000-0000-0000-000000000002', 'f3eec962-47e7-49cb-8d5d-40a719494e18', 'Contato Inicial', 2, '#f59e0b', TRUE),
('10000000-0000-0000-0000-000000000003', 'f3eec962-47e7-49cb-8d5d-40a719494e18', 'Proposta', 3, '#3b82f6', TRUE),
('10000000-0000-0000-0000-000000000004', 'f3eec962-47e7-49cb-8d5d-40a719494e18', 'Reunião', 4, '#8b5cf6', TRUE),
('10000000-0000-0000-0000-000000000005', 'f3eec962-47e7-49cb-8d5d-40a719494e18', 'Fechamento', 5, '#10b981', TRUE)
ON CONFLICT (id) DO NOTHING;
    `);
  }

  console.log('\n📱 Acesso ao Supabase SQL Editor:');
  console.log('🌐 URL: https://supabase.com/dashboard');
  console.log('🔑 Projeto: nrbsocawokmihvxfcpso');
  console.log('📝 Seção: SQL Editor');
}

// Executar teste
testPipelineSystem();

