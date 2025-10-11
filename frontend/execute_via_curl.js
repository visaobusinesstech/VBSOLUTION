// Script para executar SQL via curl
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const SUPABASE_URL = 'https://nrbsocawokmihvxfcpso.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';

async function executeViaCurl() {
  console.log('🚀 Tentando executar SQL via curl...\n');

  const sqlCommands = [
    {
      name: 'Criar tabela pipeline_stages',
      sql: `CREATE TABLE IF NOT EXISTS pipeline_stages (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        position INTEGER NOT NULL,
        color VARCHAR(7) DEFAULT '#3b82f6',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`
    },
    {
      name: 'Inserir etapas padrão',
      sql: `INSERT INTO pipeline_stages (id, pipeline_id, name, position, color, is_active) VALUES
        ('10000000-0000-0000-0000-000000000001', 'f3eec962-47e7-49cb-8d5d-40a719494e18', 'Novo Lead', 1, '#ef4444', TRUE),
        ('10000000-0000-0000-0000-000000000002', 'f3eec962-47e7-49cb-8d5d-40a719494e18', 'Contato Inicial', 2, '#f59e0b', TRUE),
        ('10000000-0000-0000-0000-000000000003', 'f3eec962-47e7-49cb-8d5d-40a719494e18', 'Proposta', 3, '#3b82f6', TRUE),
        ('10000000-0000-0000-0000-000000000004', 'f3eec962-47e7-49cb-8d5d-40a719494e18', 'Reunião', 4, '#8b5cf6', TRUE),
        ('10000000-0000-0000-0000-000000000005', 'f3eec962-47e7-49cb-8d5d-40a719494e18', 'Fechamento', 5, '#10b981', TRUE)
        ON CONFLICT (id) DO NOTHING;`
    },
    {
      name: 'Adicionar colunas na tabela leads',
      sql: `ALTER TABLE leads 
        ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES pipelines(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL;`
    }
  ];

  for (const command of sqlCommands) {
    console.log(`📝 Executando: ${command.name}`);
    
    try {
      // Criar comando curl
      const curlCommand = `curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
        -H "apikey: ${SUPABASE_ANON_KEY}" \
        -d "{\\"sql_query\\": \\"${command.sql.replace(/"/g, '\\"').replace(/\n/g, '\\n')}\\"}"`;

      console.log('🔄 Executando comando curl...');
      
      const { stdout, stderr } = await execAsync(curlCommand);
      
      if (stderr) {
        console.log('⚠️ Erro no curl:', stderr);
      } else {
        console.log('📊 Resposta:', stdout);
      }
      
    } catch (error) {
      console.log('❌ Erro ao executar curl:', error.message);
    }
    
    console.log(''); // Linha em branco
  }

  console.log('📋 Se o curl não funcionou, execute manualmente no Supabase SQL Editor:');
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

-- Verificar se funcionou
SELECT * FROM pipeline_stages ORDER BY position;
  `);
}

// Executar
executeViaCurl();

