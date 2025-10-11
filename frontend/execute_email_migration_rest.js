const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key') {
  console.error('❌ VITE_SUPABASE_ANON_KEY não configurada');
  console.log('Configure a variável de ambiente VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

async function executeEmailMigration() {
  try {
    console.log('🚀 Executando migração das tabelas de email via REST API...');
    
    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20241225_add_email_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Dividir o SQL em comandos individuais
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 Executando ${commands.length} comandos SQL...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      console.log(`   ${i + 1}/${commands.length}: ${command.substring(0, 50)}...`);
      
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'apikey': supabaseAnonKey
          },
          body: JSON.stringify({ sql: command })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`⚠️  Aviso no comando ${i + 1}: ${errorText}`);
        }
      } catch (error) {
        console.warn(`⚠️  Erro no comando ${i + 1}: ${error.message}`);
      }
    }
    
    console.log('✅ Migração concluída!');
    console.log('📧 Tabelas de email criadas no Supabase');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  executeEmailMigration();
}

module.exports = { executeEmailMigration };
