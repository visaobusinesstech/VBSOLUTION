// Script para verificar a estrutura real das tabelas
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://nrbsocawokmihvxfcpso.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTableStructure(tableName) {
  console.log(`🔍 Verificando estrutura da tabela '${tableName}'...`);
  
  try {
    // Tentar inserir um registro vazio para ver os erros de estrutura
    const { data, error } = await supabase
      .from(tableName)
      .insert([{}])
      .select()
      .single();
    
    if (error) {
      console.log(`❌ Erro ao testar ${tableName}:`, error.message);
      
      // Se for erro de coluna obrigatória, isso nos dá informações sobre a estrutura
      if (error.code === 'PGRST204') {
        console.log(`   💡 A tabela ${tableName} existe mas tem estrutura diferente do esperado`);
      }
    } else {
      console.log(`✅ Estrutura de ${tableName} está OK`);
    }
    
  } catch (err) {
    console.log(`❌ Erro geral ao verificar ${tableName}:`, err.message);
  }
}

async function trySimpleInsert() {
  console.log('\n🧪 Tentando inserção simples sem colunas opcionais...');
  
  const tables = [
    {
      name: 'company_areas',
      data: {
        company_id: '00000000-0000-0000-0000-000000000000',
        name: 'Teste'
      }
    },
    {
      name: 'company_roles', 
      data: {
        company_id: '00000000-0000-0000-0000-000000000000',
        name: 'Teste'
      }
    },
    {
      name: 'company_users',
      data: {
        company_id: '00000000-0000-0000-0000-000000000000',
        full_name: 'Teste',
        email: 'teste@teste.com',
        password_hash: 'hash123'
      }
    }
  ];
  
  for (const table of tables) {
    console.log(`\n📝 Testando ${table.name}...`);
    
    try {
      const { data, error } = await supabase
        .from(table.name)
        .insert([table.data])
        .select()
        .single();
      
      if (error) {
        console.log(`❌ Erro:`, error.message);
      } else {
        console.log(`✅ Sucesso:`, data);
      }
    } catch (err) {
      console.log(`❌ Erro geral:`, err.message);
    }
  }
}

async function main() {
  console.log('🚀 Verificando estrutura das tabelas...\n');
  
  const tables = ['company_settings', 'company_areas', 'company_roles', 'company_users', 'user_profiles'];
  
  for (const table of tables) {
    await checkTableStructure(table);
  }
  
  await trySimpleInsert();
  
  console.log('\n✅ Verificação concluída!');
}

main().catch(console.error);
