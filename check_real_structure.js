// Script para verificar a estrutura real das tabelas via consulta SQL
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://nrbsocawokmihvxfcpso.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTableColumns(tableName) {
  console.log(`🔍 Verificando colunas da tabela '${tableName}'...`);
  
  try {
    // Consultar informações das colunas da tabela
    const { data, error } = await supabase
      .rpc('get_table_columns', { table_name: tableName });
    
    if (error) {
      console.log(`❌ Erro ao verificar ${tableName}:`, error.message);
      return [];
    }
    
    if (data && data.length > 0) {
      console.log(`✅ Colunas encontradas em ${tableName}:`);
      data.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
      return data;
    } else {
      console.log(`⚠️  Nenhuma coluna encontrada em ${tableName}`);
      return [];
    }
    
  } catch (err) {
    console.log(`❌ Erro geral ao verificar ${tableName}:`, err.message);
    return [];
  }
}

async function tryDirectQuery() {
  console.log('\n🔍 Tentando consulta direta para verificar estrutura...');
  
  const tables = ['company_areas', 'company_roles', 'company_users'];
  
  for (const table of tables) {
    console.log(`\n📋 Verificando ${table}:`);
    
    try {
      // Tentar fazer um SELECT com LIMIT 0 para ver as colunas
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(0);
      
      if (error) {
        console.log(`❌ Erro:`, error.message);
      } else {
        console.log(`✅ Tabela ${table} existe e é acessível`);
      }
      
      // Tentar uma consulta mais específica
      const { data: countData, error: countError } = await supabase
        .from(table)
        .select('count', { count: 'exact' })
        .limit(1);
      
      if (countError) {
        console.log(`❌ Erro no count:`, countError.message);
      } else {
        console.log(`📊 Total de registros: ${countData?.length || 0}`);
      }
      
    } catch (err) {
      console.log(`❌ Erro geral:`, err.message);
    }
  }
}

async function createMinimalTest() {
  console.log('\n🧪 Testando inserção mínima...');
  
  try {
    // Tentar inserir apenas os campos obrigatórios
    const { data, error } = await supabase
      .from('company_areas')
      .insert([{
        company_id: '11111111-1111-1111-1111-111111111111',
        name: 'Teste Mínimo'
      }])
      .select()
      .single();
    
    if (error) {
      console.log('❌ Erro na inserção mínima:', error.message);
      
      // Se for erro de coluna, isso nos dá informação sobre a estrutura
      if (error.code === 'PGRST204') {
        console.log('💡 Isso indica que a estrutura da tabela é diferente do esperado');
      }
    } else {
      console.log('✅ Inserção mínima funcionou:', data);
    }
    
  } catch (err) {
    console.log('❌ Erro geral na inserção mínima:', err.message);
  }
}

async function main() {
  console.log('🚀 Verificando estrutura real das tabelas...\n');
  
  const tables = ['company_settings', 'company_areas', 'company_roles', 'company_users', 'user_profiles'];
  
  // Tentar verificar colunas (pode não funcionar se não tiver a função RPC)
  for (const table of tables) {
    await checkTableColumns(table);
  }
  
  // Tentar consultas diretas
  await tryDirectQuery();
  
  // Testar inserção mínima
  await createMinimalTest();
  
  console.log('\n✅ Verificação concluída!');
  console.log('\n💡 Baseado nos erros, vou criar um script SQL corrigido...');
}

main().catch(console.error);
