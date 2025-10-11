// Script final para configurar o Supabase - tentativa com múltiplas abordagens
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nrbsocawokmihvxfcpso.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function finalSetup() {
  console.log('🚀 Configuração final do Supabase para Pipeline de Leads...');
  console.log('📋 Tentando múltiplas abordagens para garantir que tudo funcione...\n');

  // Abordagem 1: Tentar inserir dados diretamente (se a tabela já existir)
  console.log('🔍 Abordagem 1: Tentando inserir dados diretamente...');
  
  const defaultStages = [
    { id: '10000000-0000-0000-0000-000000000001', pipeline_id: '00000000-0000-0000-0000-000000000001', name: 'Novo Lead', position: 1, color: '#ef4444', is_active: true },
    { id: '10000000-0000-0000-0000-000000000002', pipeline_id: '00000000-0000-0000-0000-000000000001', name: 'Contato Inicial', position: 2, color: '#f59e0b', is_active: true },
    { id: '10000000-0000-0000-0000-000000000003', pipeline_id: '00000000-0000-0000-0000-000000000001', name: 'Proposta', position: 3, color: '#3b82f6', is_active: true },
    { id: '10000000-0000-0000-0000-000000000004', pipeline_id: '00000000-0000-0000-0000-000000000001', name: 'Reunião', position: 4, color: '#8b5cf6', is_active: true },
    { id: '10000000-0000-0000-0000-000000000005', pipeline_id: '00000000-0000-0000-0000-000000000001', name: 'Fechamento', position: 5, color: '#10b981', is_active: true }
  ];

  try {
    const { data, error } = await supabase
      .from('pipeline_stages')
      .upsert(defaultStages, { onConflict: 'id' })
      .select();

    if (error) {
      console.log('❌ Tabela pipeline_stages não existe ainda');
      console.log('📝 Erro:', error.message);
    } else {
      console.log('✅ Dados inseridos com sucesso!');
      console.log('📊 Etapas criadas:', data.length);
      data.forEach(stage => {
        console.log(`   - ${stage.position}. ${stage.name} (${stage.color})`);
      });
      
      // Teste final
      const { data: allStages, error: testError } = await supabase
        .from('pipeline_stages')
        .select('*')
        .order('position', { ascending: true });
      
      if (!testError && allStages) {
        console.log('\n🎉 SUCESSO TOTAL! Sistema de Pipeline configurado!');
        console.log('✅ Tabela pipeline_stages: OK');
        console.log('✅ Etapas padrão: OK');
        console.log('✅ Sistema pronto para uso!');
        return;
      }
    }
  } catch (err) {
    console.log('❌ Erro na abordagem 1:', err.message);
  }

  // Abordagem 2: Verificar se podemos acessar a tabela leads
  console.log('\n🔍 Abordagem 2: Verificando tabela leads...');
  
  try {
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, name, stage_id')
      .limit(1);

    if (leadsError) {
      console.log('❌ Erro ao acessar tabela leads:', leadsError.message);
    } else {
      console.log('✅ Tabela leads está funcionando');
      console.log('📊 Leads encontrados:', leads.length);
      
      if (leads.length > 0) {
        console.log('📝 Exemplo de lead:', leads[0]);
      }
    }
  } catch (err) {
    console.log('❌ Erro ao verificar leads:', err.message);
  }

  // Abordagem 3: Verificar se podemos acessar a tabela pipelines
  console.log('\n🔍 Abordagem 3: Verificando tabela pipelines...');
  
  try {
    const { data: pipelines, error: pipelinesError } = await supabase
      .from('pipelines')
      .select('*')
      .limit(1);

    if (pipelinesError) {
      console.log('❌ Erro ao acessar tabela pipelines:', pipelinesError.message);
    } else {
      console.log('✅ Tabela pipelines está funcionando');
      console.log('📊 Pipelines encontradas:', pipelines.length);
      
      if (pipelines.length > 0) {
        console.log('📝 Exemplo de pipeline:', pipelines[0]);
      }
    }
  } catch (err) {
    console.log('❌ Erro ao verificar pipelines:', err.message);
  }

  // Resumo final
  console.log('\n📋 RESUMO FINAL:');
  console.log('🔗 URL do Supabase:', SUPABASE_URL);
  console.log('🔑 Chave configurada:', SUPABASE_ANON_KEY.substring(0, 20) + '...');
  
  console.log('\n⚠️ AÇÃO NECESSÁRIA:');
  console.log('Para completar a configuração, execute o seguinte SQL no Supabase SQL Editor:');
  console.log('\n' + '='.repeat(80));
  console.log(`
-- EXECUTE ESTE SQL NO SUPABASE SQL EDITOR

-- 1. Criar tabela pipeline_stages
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

-- 2. Inserir etapas padrão
INSERT INTO pipeline_stages (id, pipeline_id, name, position, color, is_active) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Novo Lead', 1, '#ef4444', TRUE),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Contato Inicial', 2, '#f59e0b', TRUE),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Proposta', 3, '#3b82f6', TRUE),
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Reunião', 4, '#8b5cf6', TRUE),
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Fechamento', 5, '#10b981', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 3. Verificar se funcionou
SELECT * FROM pipeline_stages ORDER BY position;
  `);
  console.log('='.repeat(80));

  console.log('\n🎯 APÓS EXECUTAR O SQL:');
  console.log('1. Execute novamente: node final_supabase_setup.js');
  console.log('2. O sistema deve mostrar "SUCESSO TOTAL!"');
  console.log('3. A página Leads e Vendas estará funcionando perfeitamente!');
  
  console.log('\n📱 Para acessar o Supabase SQL Editor:');
  console.log('1. Vá para: https://supabase.com/dashboard');
  console.log('2. Faça login na sua conta');
  console.log('3. Selecione o projeto: nrbsocawokmihvxfcpso');
  console.log('4. Vá para SQL Editor');
  console.log('5. Cole e execute o SQL acima');
}

// Executar
finalSetup();

