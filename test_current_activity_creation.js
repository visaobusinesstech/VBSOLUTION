// Script para testar criação de atividades no estado atual
// Execute este script no console do navegador na página /activities

console.log('🔍 TESTANDO CRIAÇÃO DE ATIVIDADES - ESTADO ATUAL');
console.log('===============================================');

async function testCurrentActivityCreation() {
  try {
    // 1. Verificar se o Supabase está disponível
    console.log('\n1. Verificando Supabase...');
    if (typeof window.supabase === 'undefined') {
      console.error('❌ Supabase não está disponível no window');
      return;
    }
    console.log('✅ Supabase disponível');

    // 2. Verificar autenticação
    console.log('\n2. Verificando autenticação...');
    const { data: { user }, error: userError } = await window.supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Erro de autenticação:', userError);
      return;
    }
    
    if (!user) {
      console.error('❌ Usuário não autenticado');
      return;
    }
    
    console.log('✅ Usuário autenticado:', user.id, user.email);

    // 3. Verificar se a tabela activities existe e é acessível
    console.log('\n3. Verificando tabela activities...');
    const { data: tableTest, error: tableError } = await window.supabase
      .from('activities')
      .select('id, title, created_by, company_id')
      .limit(5);
    
    if (tableError) {
      console.error('❌ Erro ao acessar tabela activities:', tableError);
      console.error('Detalhes:', {
        message: tableError.message,
        details: tableError.details,
        hint: tableError.hint,
        code: tableError.code
      });
      return;
    }
    
    console.log('✅ Tabela activities acessível');
    console.log(`📋 ${tableTest.length} atividades encontradas:`, tableTest);

    // 4. Verificar perfil do usuário
    console.log('\n4. Verificando perfil do usuário...');
    let companyId = null;
    
    // Tentar buscar na tabela profiles
    const { data: profile, error: profileError } = await window.supabase
      .from('profiles')
      .select('*, company_id')
      .eq('id', user.id)
      .single();
    
    if (!profileError && profile) {
      companyId = profile.company_id;
      console.log('✅ Perfil encontrado em profiles:', profile);
    } else {
      console.log('⚠️ Perfil não encontrado em profiles, tentando user_profiles...');
      
      // Tentar buscar na tabela user_profiles
      const { data: userProfile, error: userProfileError } = await window.supabase
        .from('user_profiles')
        .select('*, company_id')
        .eq('id', user.id)
        .single();
      
      if (!userProfileError && userProfile) {
        companyId = userProfile.company_id;
        console.log('✅ Perfil encontrado em user_profiles:', userProfile);
      } else {
        console.log('⚠️ Perfil não encontrado, usando dados básicos');
        console.log('❌ Erro profiles:', profileError);
        console.log('❌ Erro user_profiles:', userProfileError);
      }
    }

    // 5. Testar criação de atividade com dados mínimos
    console.log('\n5. Testando criação de atividade...');
    const testActivityData = {
      title: 'Teste Atividade - ' + new Date().toLocaleTimeString(),
      description: 'Atividade de teste criada pelo script',
      type: 'task',
      priority: 'medium',
      status: 'pending',
      created_by: user.id,
      company_id: companyId
    };
    
    console.log('📝 Dados para teste:', testActivityData);
    
    const { data: newActivity, error: createError } = await window.supabase
      .from('activities')
      .insert([testActivityData])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Erro ao criar atividade:', createError);
      console.error('Detalhes completos:', {
        message: createError.message,
        details: createError.details,
        hint: createError.hint,
        code: createError.code,
        data: createError
      });
      
      // Verificar se é erro de RLS
      if (createError.code === '42501') {
        console.error('🔒 ERRO DE PERMISSÃO (RLS) - Verificar políticas');
      }
      
      return;
    } else {
      console.log('✅ Atividade criada com sucesso:', newActivity);
    }

    // 6. Verificar se a atividade aparece na lista
    console.log('\n6. Verificando se atividade aparece na lista...');
    const { data: updatedList, error: listError } = await window.supabase
      .from('activities')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });
    
    if (listError) {
      console.error('❌ Erro ao buscar lista atualizada:', listError);
    } else {
      console.log(`✅ Lista atualizada: ${updatedList.length} atividades`);
      console.log('📋 Última atividade criada:', updatedList[0]);
    }

    // 7. Verificar políticas RLS
    console.log('\n7. Verificando políticas RLS...');
    const { data: policies, error: policiesError } = await window.supabase
      .rpc('get_table_policies', { table_name: 'activities' })
      .catch(() => {
        console.log('⚠️ Função get_table_policies não disponível');
        return { data: null, error: null };
      });
    
    if (policies && policies.length > 0) {
      console.log('✅ Políticas RLS encontradas:', policies);
    } else {
      console.log('⚠️ Não foi possível verificar políticas RLS');
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Executar teste
testCurrentActivityCreation();
