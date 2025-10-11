// Script para inserir dados diretamente usando a API REST do Supabase
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nrbsocawokmihvxfcpso.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function insertDataDirect() {
  console.log('🚀 Tentando inserir dados diretamente no Supabase...\n');

  // Primeiro, vamos verificar se a tabela pipeline_stages existe
  console.log('1️⃣ Verificando se a tabela pipeline_stages existe...');
  
  try {
    const { data: existingStages, error: checkError } = await supabase
      .from('pipeline_stages')
      .select('*')
      .limit(1);

    if (checkError) {
      console.log('❌ Tabela pipeline_stages não existe:', checkError.message);
      console.log('📝 A tabela precisa ser criada manualmente no SQL Editor do Supabase');
      
      console.log('\n🔧 SQL para executar no Supabase SQL Editor:');
      console.log(`
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

INSERT INTO pipeline_stages (id, pipeline_id, name, position, color, is_active) VALUES
('10000000-0000-0000-0000-000000000001', 'f3eec962-47e7-49cb-8d5d-40a719494e18', 'Novo Lead', 1, '#ef4444', TRUE),
('10000000-0000-0000-0000-000000000002', 'f3eec962-47e7-49cb-8d5d-40a719494e18', 'Contato Inicial', 2, '#f59e0b', TRUE),
('10000000-0000-0000-0000-000000000003', 'f3eec962-47e7-49cb-8d5d-40a719494e18', 'Proposta', 3, '#3b82f6', TRUE),
('10000000-0000-0000-0000-000000000004', 'f3eec962-47e7-49cb-8d5d-40a719494e18', 'Reunião', 4, '#8b5cf6', TRUE),
('10000000-0000-0000-0000-000000000005', 'f3eec962-47e7-49cb-8d5d-40a719494e18', 'Fechamento', 5, '#10b981', TRUE)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES pipelines(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL;
      `);
      
      return;
    } else {
      console.log('✅ Tabela pipeline_stages existe!');
      console.log(`📊 Etapas existentes: ${existingStages.length}`);
    }
  } catch (error) {
    console.log('❌ Erro ao verificar tabela:', error.message);
    return;
  }

  // Se a tabela existe, vamos inserir os dados
  console.log('\n2️⃣ Inserindo etapas padrão...');
  
  const defaultStages = [
    { 
      id: '10000000-0000-0000-0000-000000000001', 
      pipeline_id: 'f3eec962-47e7-49cb-8d5d-40a719494e18', 
      name: 'Novo Lead', 
      position: 1, 
      color: '#ef4444', 
      is_active: true 
    },
    { 
      id: '10000000-0000-0000-0000-000000000002', 
      pipeline_id: 'f3eec962-47e7-49cb-8d5d-40a719494e18', 
      name: 'Contato Inicial', 
      position: 2, 
      color: '#f59e0b', 
      is_active: true 
    },
    { 
      id: '10000000-0000-0000-0000-000000000003', 
      pipeline_id: 'f3eec962-47e7-49cb-8d5d-40a719494e18', 
      name: 'Proposta', 
      position: 3, 
      color: '#3b82f6', 
      is_active: true 
    },
    { 
      id: '10000000-0000-0000-0000-000000000004', 
      pipeline_id: 'f3eec962-47e7-49cb-8d5d-40a719494e18', 
      name: 'Reunião', 
      position: 4, 
      color: '#8b5cf6', 
      is_active: true 
    },
    { 
      id: '10000000-0000-0000-0000-000000000005', 
      pipeline_id: 'f3eec962-47e7-49cb-8d5d-40a719494e18', 
      name: 'Fechamento', 
      position: 5, 
      color: '#10b981', 
      is_active: true 
    }
  ];

  try {
    const { data: insertedStages, error: insertError } = await supabase
      .from('pipeline_stages')
      .upsert(defaultStages, { onConflict: 'id' })
      .select();

    if (insertError) {
      console.log('❌ Erro ao inserir etapas:', insertError.message);
    } else {
      console.log('✅ Etapas inseridas com sucesso!');
      console.log('📊 Etapas criadas:', insertedStages.length);
      
      insertedStages.forEach(stage => {
        console.log(`   ${stage.position}. ${stage.name} (${stage.color})`);
      });
    }
  } catch (error) {
    console.log('❌ Erro ao inserir etapas:', error.message);
  }

  // Teste final
  console.log('\n3️⃣ Teste final...');
  
  try {
    const { data: allStages, error: finalError } = await supabase
      .from('pipeline_stages')
      .select('*')
      .order('position', { ascending: true });

    if (finalError) {
      console.log('❌ Erro no teste final:', finalError.message);
    } else {
      console.log('🎉 SUCESSO TOTAL!');
      console.log('✅ Sistema de Pipeline configurado com sucesso!');
      console.log(`📊 Total de etapas: ${allStages.length}`);
      
      console.log('\n🎯 Etapas configuradas:');
      allStages.forEach(stage => {
        console.log(`   ${stage.position}. ${stage.name} (${stage.color})`);
      });
      
      console.log('\n🚀 Sistema pronto para uso!');
      console.log('✅ Acesse a página Leads e Vendas no sistema');
    }
  } catch (error) {
    console.log('❌ Erro no teste final:', error.message);
  }
}

// Executar
insertDataDirect();

