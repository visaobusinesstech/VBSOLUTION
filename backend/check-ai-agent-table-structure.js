#!/usr/bin/env node

/**
 * Script para verificar a estrutura da tabela ai_agent_configs
 */

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Verificando estrutura da tabela ai_agent_configs...\n');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkTableStructure() {
  try {
    // Tentar fazer uma consulta simples para ver a estrutura
    const { data, error } = await supabase
      .from('ai_agent_configs')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao consultar tabela:', error);
      
      // Se a tabela não existe, vamos verificar se existe alguma tabela similar
      console.log('\n🔍 Verificando tabelas disponíveis...');
      
      // Tentar consultar informações do schema
      const { data: schemaData, error: schemaError } = await supabase
        .rpc('get_schema_info');
      
      if (schemaError) {
        console.log('💡 Tentando criar a tabela ai_agent_configs...');
        await createAIAgentTable();
      }
    } else {
      console.log('✅ Tabela ai_agent_configs encontrada!');
      console.log('📋 Estrutura da tabela:');
      
      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        columns.forEach(column => {
          console.log(`   - ${column}: ${typeof data[0][column]}`);
        });
      } else {
        console.log('   (Tabela vazia)');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

async function createAIAgentTable() {
  console.log('🔧 Criando tabela ai_agent_configs...');
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS ai_agent_configs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      system_prompt TEXT,
      model TEXT DEFAULT 'gpt-4',
      temperature DECIMAL DEFAULT 0.7,
      max_tokens INTEGER DEFAULT 1000,
      message_settings JSONB DEFAULT '{}',
      integrations JSONB DEFAULT '{}',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      console.error('❌ Erro ao criar tabela:', error);
      console.log('💡 Você pode criar a tabela manualmente no Supabase Dashboard');
      console.log('📋 SQL para criar a tabela:');
      console.log(createTableSQL);
    } else {
      console.log('✅ Tabela criada com sucesso!');
    }
    
  } catch (error) {
    console.error('❌ Erro ao executar SQL:', error);
    console.log('💡 Você pode criar a tabela manualmente no Supabase Dashboard');
    console.log('📋 SQL para criar a tabela:');
    console.log(createTableSQL);
  }
}

checkTableStructure();
