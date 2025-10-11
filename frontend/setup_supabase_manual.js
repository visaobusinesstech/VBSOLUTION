// Script para configurar o Supabase manualmente
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nrbsocawokmihvxfcpso.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setupSupabaseManual() {
  console.log('🚀 Configurando Supabase para Pipeline de Leads...\n');

  // Verificar status atual
  console.log('📋 Verificando status atual do sistema...\n');

  // Verificar tabela pipelines
  console.log('1️⃣ Verificando tabela pipelines...');
  try {
    const { data: pipelines, error } = await supabase
      .from('pipelines')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Erro na tabela pipelines:', error.message);
    } else {
      console.log('✅ Tabela pipelines: OK');
      console.log(`📊 Pipelines encontradas: ${pipelines.length}`);
      if (pipelines.length > 0) {
        console.log(`📝 Pipeline padrão: ${pipelines[0].name} (ID: ${pipelines[0].id})`);
      }
    }
  } catch (err) {
    console.log('❌ Erro ao verificar pipelines:', err.message);
  }

  // Verificar tabela leads
  console.log('\n2️⃣ Verificando tabela leads...');
  try {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, name')
      .limit(1);

    if (error) {
      console.log('❌ Erro na tabela leads:', error.message);
    } else {
      console.log('✅ Tabela leads: OK');
      console.log(`📊 Leads encontrados: ${leads.length}`);
    }
  } catch (err) {
    console.log('❌ Erro ao verificar leads:', err.message);
  }

  // Verificar tabela pipeline_stages
  console.log('\n3️⃣ Verificando tabela pipeline_stages...');
  try {
    const { data: stages, error } = await supabase
      .from('pipeline_stages')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Tabela pipeline_stages não existe:', error.message);
    } else {
      console.log('✅ Tabela pipeline_stages: OK');
      console.log(`📊 Etapas encontradas: ${stages.length}`);
    }
  } catch (err) {
    console.log('❌ Erro ao verificar pipeline_stages:', err.message);
  }

  console.log('\n' + '='.repeat(80));
  console.log('📋 INSTRUÇÕES PARA CONFIGURAR O SUPABASE');
  console.log('='.repeat(80));

  console.log('\n🔧 PASSO 1: Acessar o Supabase SQL Editor');
  console.log('1. Abra seu navegador e vá para: https://supabase.com/dashboard');
  console.log('2. Faça login na sua conta');
  console.log('3. Selecione o projeto: nrbsocawokmihvxfcpso');
  console.log('4. No menu lateral, clique em "SQL Editor"');
  console.log('5. Clique em "New query"');

  console.log('\n🔧 PASSO 2: Executar o SQL');
  console.log('Copie e cole o seguinte SQL no editor:');
  console.log('\n' + '='.repeat(80));
  console.log('-- SQL PARA EXECUTAR NO SUPABASE SQL EDITOR');
  console.log('='.repeat(80));
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
('10000000-0000-0000-0000-000000000001', 'f3eec962-47e7-49cb-8d5d-40a719494e18', 'Novo Lead', 1, '#ef4444', TRUE),
('10000000-0000-0000-0000-000000000002', 'f3eec962-47e7-49cb-8d5d-40a719494e18', 'Contato Inicial', 2, '#f59e0b', TRUE),
('10000000-0000-0000-0000-000000000003', 'f3eec962-47e7-49cb-8d5d-40a719494e18', 'Proposta', 3, '#3b82f6', TRUE),
('10000000-0000-0000-0000-000000000004', 'f3eec962-47e7-49cb-8d5d-40a719494e18', 'Reunião', 4, '#8b5cf6', TRUE),
('10000000-0000-0000-0000-000000000005', 'f3eec962-47e7-49cb-8d5d-40a719494e18', 'Fechamento', 5, '#10b981', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 3. Adicionar colunas na tabela leads
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES pipelines(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL;

-- 4. Verificar se funcionou
SELECT * FROM pipeline_stages ORDER BY position;
  `);
  console.log('='.repeat(80));

  console.log('\n🔧 PASSO 3: Executar o SQL');
  console.log('1. Clique no botão "Run" ou pressione Ctrl+Enter');
  console.log('2. Aguarde a execução');
  console.log('3. Verifique se apareceu a mensagem "Success"');
  console.log('4. Você deve ver 5 etapas listadas no final');

  console.log('\n🔧 PASSO 4: Verificar se funcionou');
  console.log('Após executar o SQL, execute este comando para verificar:');
  console.log('node verify_complete_setup.js');

  console.log('\n🎯 RESULTADO ESPERADO:');
  console.log('✅ Tabela pipeline_stages criada');
  console.log('✅ 5 etapas inseridas (Novo Lead, Contato Inicial, Proposta, Reunião, Fechamento)');
  console.log('✅ Colunas pipeline_id e stage_id adicionadas na tabela leads');
  console.log('✅ Sistema de Pipeline funcionando com dados reais');

  console.log('\n🚀 APÓS CONFIGURAR:');
  console.log('1. A página Leads e Vendas mostrará dados reais do Supabase');
  console.log('2. Você poderá criar leads que serão salvos no banco');
  console.log('3. Os leads poderão ser movidos entre etapas');
  console.log('4. Todas as funcionalidades do Kanban funcionarão perfeitamente');

  console.log('\n📱 LINKS ÚTEIS:');
  console.log('🌐 Supabase Dashboard: https://supabase.com/dashboard');
  console.log('🔑 Projeto: nrbsocawokmihvxfcpso');
  console.log('📝 SQL Editor: https://supabase.com/dashboard/project/nrbsocawokmihvxfcpso/sql');
  console.log('🏠 Sistema Local: http://localhost:5173/leads-sales');

  console.log('\n' + '='.repeat(80));
  console.log('🎉 SISTEMA PRONTO APÓS EXECUTAR O SQL!');
  console.log('='.repeat(80));
}

// Executar
setupSupabaseManual();

