// Script para executar SQL diretamente usando o cliente Supabase
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nrbsocawokmihvxfcpso.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function executeSQLDirect() {
  console.log('🚀 Executando SQL diretamente no Supabase...\n');

  try {
    // Primeiro, vamos tentar criar a tabela usando uma função SQL personalizada
    console.log('1️⃣ Tentando criar tabela pipeline_stages...');
    
    // Usar a função SQL personalizada se existir
    const createTableResult = await supabase.rpc('exec_sql', {
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
    });

    if (createTableResult.error) {
      console.log('⚠️ Função exec_sql não disponível:', createTableResult.error.message);
      console.log('📝 Tentando abordagem alternativa...');
      
      // Tentar criar a tabela usando uma abordagem diferente
      try {
        // Usar a API REST diretamente
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY
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
          console.log('✅ Tabela pipeline_stages criada via API REST!');
        } else {
          const errorText = await response.text();
          console.log('❌ Erro na API REST:', errorText);
        }
      } catch (apiError) {
        console.log('❌ Erro na API REST:', apiError.message);
      }
    } else {
      console.log('✅ Tabela pipeline_stages criada via RPC!');
    }

    // Aguardar um pouco para a tabela ser criada
    console.log('\n⏳ Aguardando criação da tabela...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Agora tentar inserir os dados
    console.log('\n2️⃣ Tentando inserir etapas padrão...');
    
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

    const { data: insertedStages, error: insertError } = await supabase
      .from('pipeline_stages')
      .upsert(defaultStages, { onConflict: 'id' })
      .select();

    if (insertError) {
      console.log('❌ Erro ao inserir etapas:', insertError.message);
      
      if (insertError.message.includes('does not exist')) {
        console.log('\n📋 A tabela ainda não existe. Execute manualmente no Supabase SQL Editor:');
        console.log(`
-- Copie e execute este SQL no Supabase SQL Editor:

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
      }
    } else {
      console.log('✅ Etapas inseridas com sucesso!');
      console.log('📊 Etapas criadas:', insertedStages.length);
      
      insertedStages.forEach(stage => {
        console.log(`   ${stage.position}. ${stage.name} (${stage.color})`);
      });
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

  } catch (error) {
    console.error('❌ Erro geral:', error);
    console.log('\n📋 Execute o SQL manualmente no Supabase SQL Editor');
  }

  console.log('\n📱 Para acessar o Supabase SQL Editor:');
  console.log('🌐 URL: https://supabase.com/dashboard');
  console.log('🔑 Projeto: nrbsocawokmihvxfcpso');
  console.log('📝 Seção: SQL Editor');
}

// Executar
executeSQLDirect();

