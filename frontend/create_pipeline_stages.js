import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function createPipelineStages() {
  console.log('🚀 Criando tabela pipeline_stages e inserindo dados...');
  
  try {
    // Primeiro, vamos tentar criar a tabela usando uma abordagem diferente
    console.log('\n📝 Tentando criar tabela pipeline_stages...');
    
    // Usar a API REST diretamente para executar SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify({
        sql_query: `
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
        `
      })
    });

    if (response.ok) {
      console.log('✅ Tabela pipeline_stages criada com sucesso!');
    } else {
      console.log('⚠️ Não foi possível criar via RPC, tentando abordagem alternativa...');
    }

    // Tentar inserir dados diretamente (se a tabela já existir ou foi criada)
    console.log('\n📝 Tentando inserir etapas padrão...');
    
    const defaultStages = [
      { id: '10000000-0000-0000-0000-000000000001', pipeline_id: '00000000-0000-0000-0000-000000000001', name: 'Novo Lead', position: 1, color: '#ef4444', is_active: true },
      { id: '10000000-0000-0000-0000-000000000002', pipeline_id: '00000000-0000-0000-0000-000000000001', name: 'Contato Inicial', position: 2, color: '#f59e0b', is_active: true },
      { id: '10000000-0000-0000-0000-000000000003', pipeline_id: '00000000-0000-0000-0000-000000000001', name: 'Proposta', position: 3, color: '#3b82f6', is_active: true },
      { id: '10000000-0000-0000-0000-000000000004', pipeline_id: '00000000-0000-0000-0000-000000000001', name: 'Reunião', position: 4, color: '#8b5cf6', is_active: true },
      { id: '10000000-0000-0000-0000-000000000005', pipeline_id: '00000000-0000-0000-0000-000000000001', name: 'Fechamento', position: 5, color: '#10b981', is_active: true }
    ];

    const { data: insertedStages, error: insertError } = await supabase
      .from('pipeline_stages')
      .upsert(defaultStages, { onConflict: 'id' })
      .select();

    if (insertError) {
      console.log('❌ Erro ao inserir etapas:', insertError.message);
      console.log('📝 Isso indica que a tabela ainda não existe.');
      console.log('\n🔧 SOLUÇÃO: Execute o seguinte SQL no Supabase SQL Editor:');
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
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Novo Lead', 1, '#ef4444', TRUE),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Contato Inicial', 2, '#f59e0b', TRUE),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Proposta', 3, '#3b82f6', TRUE),
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Reunião', 4, '#8b5cf6', TRUE),
('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Fechamento', 5, '#10b981', TRUE)
ON CONFLICT (id) DO NOTHING;
      `);
    } else {
      console.log('✅ Etapas inseridas com sucesso!');
      console.log('📊 Etapas criadas:', insertedStages.length);
      insertedStages.forEach(stage => {
        console.log(`   - ${stage.position}. ${stage.name} (${stage.color})`);
      });
    }

    // Teste final
    console.log('\n🧪 Teste final - buscando todas as etapas...');
    const { data: allStages, error: finalError } = await supabase
      .from('pipeline_stages')
      .select('*')
      .order('position', { ascending: true });
    
    if (finalError) {
      console.log('❌ Erro no teste final:', finalError.message);
      console.log('📝 A tabela ainda não existe. Execute o SQL acima no Supabase SQL Editor.');
    } else {
      console.log('✅ Teste final bem-sucedido!');
      console.log(`📊 Total de etapas encontradas: ${allStages.length}`);
      
      if (allStages.length > 0) {
        console.log('\n🎯 Etapas disponíveis:');
        allStages.forEach(stage => {
          console.log(`   ${stage.position}. ${stage.name} (${stage.color}) - ID: ${stage.id}`);
        });
        
        console.log('\n🎉 Sistema de Pipeline configurado com sucesso!');
        console.log('✅ Tabela pipeline_stages: OK');
        console.log('✅ Etapas padrão: OK');
        console.log('✅ Sistema pronto para uso!');
      } else {
        console.log('⚠️ Nenhuma etapa encontrada. Execute o SQL para inserir as etapas padrão.');
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
    console.log('\n🔧 SOLUÇÃO: Execute o SQL manualmente no Supabase SQL Editor');
  }
}

// Executar a função
createPipelineStages();

