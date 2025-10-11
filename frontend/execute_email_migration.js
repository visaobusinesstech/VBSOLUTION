const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

if (!supabaseServiceKey || supabaseServiceKey === 'your-service-role-key') {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada');
  console.log('Configure a variável de ambiente SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeEmailMigration() {
  try {
    console.log('🚀 Executando migração das tabelas de email...');
    
    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20241225_add_email_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Executar a migração
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Erro ao executar migração:', error);
      return;
    }
    
    console.log('✅ Migração executada com sucesso!');
    console.log('📧 Tabelas criadas:');
    console.log('   - email_settings');
    console.log('   - emails');
    console.log('🔒 RLS (Row Level Security) habilitado');
    console.log('📊 Índices criados para performance');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  executeEmailMigration();
}

module.exports = { executeEmailMigration };
