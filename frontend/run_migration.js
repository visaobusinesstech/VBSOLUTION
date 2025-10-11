// Script para executar a migração SQL no Supabase
// Execute com: node run_migration.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  console.error('Certifique-se de que VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Iniciando migração do Kanban...');
  
  try {
    // Ler o arquivo de migração
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20241224_add_kanban_columns.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Arquivo de migração não encontrado:', migrationPath);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Arquivo de migração carregado');
    
    // Executar a migração
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Erro ao executar migração:', error);
      process.exit(1);
    }
    
    console.log('✅ Migração executada com sucesso!');
    console.log('📊 Dados retornados:', data);
    
  } catch (err) {
    console.error('❌ Erro durante a migração:', err);
    process.exit(1);
  }
}

runMigration();
