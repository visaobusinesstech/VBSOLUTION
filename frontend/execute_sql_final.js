// Script final para executar SQL diretamente no Supabase
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nrbsocawokmihvxfcpso.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function executeSQLFinal() {
  console.log('🚀 Executando configuração final do Supabase...\n');

  try {
    // Primeiro, vamos tentar criar a tabela pipeline_stages usando uma abordagem direta
    console.log('1️⃣ Criando tabela pipeline_stages...');
    
    // Usar a função SQL personalizada se existir
    const createTableSQL = `
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
    `;

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          sql_query: createTableSQL
        })
      });

      if (response.ok) {
        console.log('✅ Tabela pipeline_stages criada via RPC');
      } else {
        const error = await response.text();
        console.log('⚠️ RPC não disponível, tentando abordagem alternativa...');
        console.log('📝 Erro RPC:', error);
      }
    } catch (rpcError) {
      console.log('⚠️ RPC não funcionou, continuando com abordagem alternativa...');
    }

    // Agora vamos tentar inserir os dados diretamente
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
      
      // Se a tabela não existe, vamos tentar criar usando uma abordagem diferente
      if (insertError.message.includes('does not exist')) {
        console.log('\n🔧 Tabela não existe. Tentando criar via API REST...');
        
        // Tentar criar a tabela usando uma chamada direta à API
        try {
          const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
              query: createTableSQL
            })
          });
          
          if (createResponse.ok) {
            console.log('✅ Tabela criada via API REST');
            
            // Tentar inserir novamente
            const { data: retryInsert, error: retryError } = await supabase
              .from('pipeline_stages')
              .upsert(defaultStages, { onConflict: 'id' })
              .select();
              
            if (retryError) {
              console.log('❌ Ainda não foi possível inserir:', retryError.message);
            } else {
              console.log('✅ Etapas inseridas com sucesso!');
              console.log('📊 Etapas criadas:', retryInsert.length);
            }
          } else {
            console.log('❌ Não foi possível criar a tabela via API REST');
          }
        } catch (apiError) {
          console.log('❌ Erro na API REST:', apiError.message);
        }
      }
    } else {
      console.log('✅ Etapas inseridas com sucesso!');
      console.log('📊 Etapas criadas:', insertedStages.length);
      
      insertedStages.forEach(stage => {
        console.log(`   ${stage.position}. ${stage.name} (${stage.color})`);
      });
    }

    // Agora vamos tentar adicionar as colunas na tabela leads
    console.log('\n3️⃣ Tentando adicionar colunas na tabela leads...');
    
    const alterTableSQL = `
      ALTER TABLE leads 
      ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES pipelines(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL;
    `;

    try {
      const alterResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          sql_query: alterTableSQL
        })
      });

      if (alterResponse.ok) {
        console.log('✅ Colunas adicionadas na tabela leads');
      } else {
        console.log('⚠️ Não foi possível adicionar colunas via RPC');
      }
    } catch (alterError) {
      console.log('⚠️ Erro ao adicionar colunas:', alterError.message);
    }

    // Teste final
    console.log('\n4️⃣ Teste final...');
    
    try {
      const { data: testStages, error: testError } = await supabase
        .from('pipeline_stages')
        .select('*')
        .order('position', { ascending: true });

      if (testError) {
        console.log('❌ Teste final falhou:', testError.message);
        console.log('\n📋 AÇÃO NECESSÁRIA:');
        console.log('Execute o SQL manualmente no Supabase SQL Editor:');
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
      } else {
        console.log('🎉 SUCESSO TOTAL!');
        console.log('✅ Sistema de Pipeline configurado com sucesso!');
        console.log('📊 Etapas encontradas:', testStages.length);
        
        testStages.forEach(stage => {
          console.log(`   ${stage.position}. ${stage.name} (${stage.color})`);
        });
        
        console.log('\n🚀 Sistema pronto para uso!');
        console.log('✅ Acesse a página Leads e Vendas no sistema');
      }
    } catch (finalError) {
      console.log('❌ Erro no teste final:', finalError.message);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }

  console.log('\n📱 Para acessar o Supabase SQL Editor:');
  console.log('🌐 URL: https://supabase.com/dashboard');
  console.log('🔑 Projeto: nrbsocawokmihvxfcpso');
  console.log('📝 Seção: SQL Editor');
}

// Executar
executeSQLFinal();

