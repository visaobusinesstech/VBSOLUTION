// Script para executar SQL diretamente via REST API do Supabase
// Este script tenta criar a tabela pipeline_stages usando a API REST

const SUPABASE_URL = 'https://nrbsocawokmihvxfcpso.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';

async function executeSQL() {
  console.log('🚀 Tentando executar SQL via REST API do Supabase...');
  
  const sqlCommands = [
    {
      name: 'Criar tabela pipeline_stages',
      sql: `
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
    },
    {
      name: 'Inserir etapas padrão',
      sql: `
        INSERT INTO pipeline_stages (id, pipeline_id, name, position, color, is_active) VALUES
        ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Novo Lead', 1, '#ef4444', TRUE),
        ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Contato Inicial', 2, '#f59e0b', TRUE),
        ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Proposta', 3, '#3b82f6', TRUE),
        ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Reunião', 4, '#8b5cf6', TRUE),
        ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Fechamento', 5, '#10b981', TRUE)
        ON CONFLICT (id) DO NOTHING;
      `
    }
  ];

  for (const command of sqlCommands) {
    console.log(`\n📝 Executando: ${command.name}`);
    
    try {
      // Tentar usar a função SQL personalizada se existir
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          sql_query: command.sql
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ ${command.name} - Sucesso!`);
      } else {
        const error = await response.text();
        console.log(`❌ ${command.name} - Erro:`, error);
      }
    } catch (error) {
      console.log(`❌ ${command.name} - Erro:`, error.message);
    }
  }

  // Testar se funcionou
  console.log('\n🧪 Testando se a tabela foi criada...');
  
  try {
    const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/pipeline_stages?select=*&limit=1`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });

    if (testResponse.ok) {
      const data = await testResponse.json();
      console.log('✅ Tabela pipeline_stages existe e está acessível!');
      console.log(`📊 Dados encontrados: ${data.length} registros`);
    } else {
      console.log('❌ Tabela ainda não existe ou não está acessível');
    }
  } catch (error) {
    console.log('❌ Erro ao testar tabela:', error.message);
  }

  console.log('\n📋 RESUMO:');
  console.log('Se a tabela não foi criada via script, execute manualmente no Supabase SQL Editor:');
  console.log(`
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
}

// Executar
executeSQL();

