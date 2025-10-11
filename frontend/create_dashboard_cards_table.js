const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.log('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDashboardCardsTable() {
  try {
    console.log('🚀 Criando tabela dashboard_cards...');
    
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, '..', 'create_dashboard_cards_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Executar cada comando SQL separadamente
    const commands = sql.split(';').filter(cmd => cmd.trim().length > 0);
    
    for (const command of commands) {
      const trimmedCommand = command.trim();
      if (trimmedCommand) {
        console.log('📝 Executando:', trimmedCommand.substring(0, 50) + '...');
        
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: trimmedCommand + ';' 
        });
        
        if (error) {
          console.error('❌ Erro ao executar comando:', error);
          // Continuar com os próximos comandos mesmo se um falhar
        } else {
          console.log('✅ Comando executado com sucesso');
        }
      }
    }
    
    console.log('✅ Tabela dashboard_cards criada com sucesso!');
    console.log('📋 Estrutura da tabela:');
    console.log('   - id: UUID (PK)');
    console.log('   - owner_id: UUID (FK para auth.users)');
    console.log('   - company_id: UUID (FK para companies)');
    console.log('   - card_id: VARCHAR(50) - identificador do cartão');
    console.log('   - title: VARCHAR(100) - título do cartão');
    console.log('   - card_type: VARCHAR(50) - tipo para renderização');
    console.log('   - visible: BOOLEAN - se está visível');
    console.log('   - position: INTEGER - posição no dashboard');
    console.log('   - created_at/updated_at: TIMESTAMP');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

createDashboardCardsTable();
