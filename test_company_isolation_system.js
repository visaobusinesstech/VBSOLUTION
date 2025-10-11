// =====================================================
// SCRIPT PARA TESTAR O SISTEMA DE ISOLAMENTO POR EMPRESA
// =====================================================
// Este script testa se o sistema de isolamento por empresa está funcionando
// =====================================================

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (substitua pelas suas credenciais)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompanyIsolation() {
  console.log('🧪 Iniciando testes de isolamento por empresa...\n');

  try {
    // 1. Testar função get_user_company_id
    console.log('1️⃣ Testando função get_user_company_id...');
    const { data: companyId, error: companyIdError } = await supabase
      .rpc('get_user_company_id');
    
    if (companyIdError) {
      console.error('❌ Erro ao obter company_id:', companyIdError);
    } else {
      console.log('✅ Company ID obtido:', companyId);
    }

    // 2. Verificar se o usuário tem perfil com company_id
    console.log('\n2️⃣ Verificando perfil do usuário...');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      console.log('✅ Usuário autenticado:', user.email);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('❌ Erro ao obter perfil:', profileError);
      } else {
        console.log('✅ Perfil encontrado:', {
          id: profile.id,
          name: profile.name,
          company: profile.company,
          company_id: profile.company_id
        });
      }
    } else {
      console.log('❌ Nenhum usuário autenticado');
      return;
    }

    // 3. Testar isolamento de dados por empresa
    console.log('\n3️⃣ Testando isolamento de dados...');
    
    // Testar acesso a companies
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*');
    
    if (companiesError) {
      console.error('❌ Erro ao acessar companies:', companiesError);
    } else {
      console.log('✅ Companies acessíveis:', companies.length);
      companies.forEach(company => {
        console.log(`   - ${company.fantasy_name} (ID: ${company.id})`);
      });
    }

    // Testar acesso a profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      console.error('❌ Erro ao acessar profiles:', profilesError);
    } else {
      console.log('✅ Profiles acessíveis:', profiles.length);
      profiles.forEach(profile => {
        console.log(`   - ${profile.name} (Company ID: ${profile.company_id})`);
      });
    }

    // 4. Testar criação de dados
    console.log('\n4️⃣ Testando criação de dados...');
    
    // Criar uma atividade de teste
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .insert([
        {
          title: 'Teste de Isolamento',
          description: 'Atividade criada para testar o isolamento por empresa',
          type: 'task',
          status: 'pending'
        }
      ])
      .select()
      .single();
    
    if (activityError) {
      console.error('❌ Erro ao criar atividade:', activityError);
    } else {
      console.log('✅ Atividade criada:', {
        id: activity.id,
        title: activity.title,
        company_id: activity.company_id
      });
      
      // Limpar a atividade de teste
      await supabase
        .from('activities')
        .delete()
        .eq('id', activity.id);
      console.log('🧹 Atividade de teste removida');
    }

    // 5. Verificar políticas RLS
    console.log('\n5️⃣ Verificando políticas RLS...');
    
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .like('tablename', '%')
      .like('policyname', '%Isolamento por empresa%');
    
    if (policiesError) {
      console.log('⚠️ Não foi possível verificar políticas RLS (normal em alguns casos)');
    } else {
      console.log('✅ Políticas RLS encontradas:', policies.length);
      policies.forEach(policy => {
        console.log(`   - ${policy.tablename}: ${policy.policyname}`);
      });
    }

    console.log('\n🎉 Testes de isolamento por empresa concluídos!');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
}

// Função para testar cadastro de novo usuário
async function testUserRegistration() {
  console.log('\n🧪 Testando cadastro de novo usuário...');
  
  const testEmail = `teste${Date.now()}@exemplo.com`;
  const testPassword = 'senha123456';
  const testName = 'Usuário Teste';
  const testCompany = 'Empresa Teste';
  
  try {
    // Cadastrar usuário
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: testName,
          company: testCompany
        }
      }
    });
    
    if (error) {
      console.error('❌ Erro no cadastro:', error);
    } else {
      console.log('✅ Usuário cadastrado:', testEmail);
      console.log('📧 Verifique o email para confirmar a conta');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o cadastro:', error);
  }
}

// Executar testes
async function main() {
  console.log('🚀 Iniciando testes do sistema de isolamento por empresa\n');
  
  // Verificar se há usuário autenticado
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    await testCompanyIsolation();
  } else {
    console.log('⚠️ Nenhum usuário autenticado. Faça login primeiro ou teste o cadastro.');
    console.log('Para testar o cadastro, descomente a linha abaixo:');
    console.log('// await testUserRegistration();');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testCompanyIsolation,
  testUserRegistration
};
