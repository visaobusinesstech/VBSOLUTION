// Script para debugar criação de atividades
// Execute este script no console do navegador na página /activities

console.log('🔍 DEBUGANDO CRIAÇÃO DE ATIVIDADES');
console.log('==================================');

async function debugActivityCreation() {
  try {
    // 1. Verificar autenticação
    console.log('\n1. Verificando autenticação...');
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

    // 2. Verificar estrutura da tabela activities
    console.log('\n2. Verificando estrutura da tabela activities...');
    const { data: tableInfo, error: tableError } = await window.supabase
      .from('activities')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Erro ao acessar tabela activities:', tableError);
      
      // Tentar criar a tabela se não existir
      console.log('🔧 Tentando criar tabela activities...');
      const { data: createData, error: createError } = await window.supabase.rpc('create_activities_table');
      
      if (createError) {
        console.error('❌ Erro ao criar tabela:', createError);
      } else {
        console.log('✅ Tabela activities criada');
      }
      
      return;
    }
    
    console.log('✅ Tabela activities acessível');

    // 3. Verificar perfil do usuário
    console.log('\n3. Verificando perfil do usuário...');
    const { data: profile, error: profileError } = await window.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError);
      
      // Tentar buscar na tabela user_profiles
      const { data: userProfile, error: userProfileError } = await window.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (userProfileError) {
        console.error('❌ Erro ao buscar user_profile:', userProfileError);
      } else {
        console.log('✅ Perfil encontrado em user_profiles:', userProfile);
      }
    } else {
      console.log('✅ Perfil encontrado em profiles:', profile);
    }

    // 4. Testar criação de atividade
    console.log('\n4. Testando criação de atividade...');
    const testActivityData = {
      title: 'Teste de Atividade - ' + new Date().toLocaleTimeString(),
      description: 'Esta é uma atividade de teste',
      type: 'task',
      priority: 'medium',
      status: 'pending',
      created_by: user.id,
      company_id: profile?.company_id || null
    };
    
    console.log('📝 Dados de teste:', testActivityData);
    
    const { data: newActivity, error: createActivityError } = await window.supabase
      .from('activities')
      .insert([testActivityData])
      .select()
      .single();
    
    if (createActivityError) {
      console.error('❌ Erro ao criar atividade:', createActivityError);
      console.error('Detalhes do erro:', createActivityError);
    } else {
      console.log('✅ Atividade criada com sucesso:', newActivity);
    }

    // 5. Verificar atividades existentes
    console.log('\n5. Verificando atividades existentes...');
    const { data: existingActivities, error: fetchError } = await window.supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Erro ao buscar atividades:', fetchError);
    } else {
      console.log(`✅ ${existingActivities.length} atividades encontradas`);
      if (existingActivities.length > 0) {
        console.log('📋 Última atividade:', existingActivities[0]);
      }
    }

    // 6. Verificar políticas RLS
    console.log('\n6. Verificando políticas RLS...');
    const { data: policies, error: policiesError } = await window.supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'activities');
    
    if (policiesError) {
      console.log('⚠️ Não foi possível verificar políticas RLS:', policiesError);
    } else {
      console.log(`✅ ${policies.length} políticas RLS encontradas para activities`);
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar debug
debugActivityCreation();
