// Script final para testar se a solução funcionou
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://nrbsocawokmihvxfcpso.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDatabaseOperations() {
  console.log('🧪 Testando operações do banco de dados...\n');
  
  const companyId = '11111111-1111-1111-1111-111111111111';
  
  // 1. Testar criação de área
  console.log('1️⃣ Testando criação de área...');
  try {
    const { data: areaData, error: areaError } = await supabase
      .from('company_areas')
      .insert([{
        company_id: companyId,
        name: 'Área de Teste Final',
        description: 'Teste após correção do RLS'
      }])
      .select()
      .single();
    
    if (areaError) {
      console.log('❌ Erro ao criar área:', areaError.message);
    } else {
      console.log('✅ Área criada com sucesso:', areaData.name);
    }
  } catch (err) {
    console.log('❌ Erro geral ao criar área:', err.message);
  }
  
  // 2. Testar criação de cargo
  console.log('\n2️⃣ Testando criação de cargo...');
  try {
    const { data: roleData, error: roleError } = await supabase
      .from('company_roles')
      .insert([{
        company_id: companyId,
        name: 'Cargo de Teste Final',
        description: 'Teste após correção do RLS',
        permissions: {
          view_dashboard: true,
          create_tasks: true
        }
      }])
      .select()
      .single();
    
    if (roleError) {
      console.log('❌ Erro ao criar cargo:', roleError.message);
    } else {
      console.log('✅ Cargo criado com sucesso:', roleData.name);
    }
  } catch (err) {
    console.log('❌ Erro geral ao criar cargo:', err.message);
  }
  
  // 3. Testar criação de usuário
  console.log('\n3️⃣ Testando criação de usuário...');
  try {
    const { data: userData, error: userError } = await supabase
      .from('company_users')
      .insert([{
        company_id: companyId,
        full_name: 'Usuário Teste Final',
        email: 'testefinal@empresa.com',
        password_hash: 'hash123',
        status: 'active'
      }])
      .select()
      .single();
    
    if (userError) {
      console.log('❌ Erro ao criar usuário:', userError.message);
    } else {
      console.log('✅ Usuário criado com sucesso:', userData.full_name);
    }
  } catch (err) {
    console.log('❌ Erro geral ao criar usuário:', err.message);
  }
  
  // 4. Testar busca de dados
  console.log('\n4️⃣ Testando busca de dados...');
  try {
    const { data: areas, error: areasError } = await supabase
      .from('company_areas')
      .select('*')
      .eq('company_id', companyId);
    
    if (areasError) {
      console.log('❌ Erro ao buscar áreas:', areasError.message);
    } else {
      console.log('✅ Áreas encontradas:', areas?.length || 0);
      areas?.forEach(area => {
        console.log(`   - ${area.name} (${area.id})`);
      });
    }
  } catch (err) {
    console.log('❌ Erro geral ao buscar áreas:', err.message);
  }
}

async function checkExistingData() {
  console.log('🔍 Verificando dados existentes...\n');
  
  try {
    // Verificar empresas
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, fantasy_name');
    
    if (companiesError) {
      console.log('❌ Erro ao buscar empresas:', companiesError.message);
    } else {
      console.log('📊 Empresas encontradas:', companies?.length || 0);
      companies?.forEach(company => {
        console.log(`   - ${company.fantasy_name} (${company.id})`);
      });
    }
    
  } catch (err) {
    console.log('❌ Erro ao verificar dados:', err.message);
  }
}

async function main() {
  console.log('🚀 TESTE FINAL DA SOLUÇÃO\n');
  console.log('Este script testa se as operações do banco funcionam após a correção.\n');
  
  await checkExistingData();
  console.log('\n' + '='.repeat(50) + '\n');
  await testDatabaseOperations();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ TESTE CONCLUÍDO!');
  console.log('\nSe você viu mensagens de sucesso acima,');
  console.log('o sistema de configurações deve funcionar agora!');
  console.log('\nTeste criando uma área na página /settings → Estrutura');
}

main().catch(console.error);
