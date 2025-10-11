// Script para debugar problemas de autenticação e tabela
// Execute este script no console do navegador na página /activities

console.log('🔍 DEBUGANDO AUTENTICAÇÃO E TABELA ACTIVITIES');
console.log('==========================================');

async function debugAuthAndTable() {
  try {
    // 1. Verificar se o Supabase está disponível
    console.log('\n1. Verificando Supabase...');
    if (typeof window.supabase === 'undefined') {
      console.error('❌ Supabase não está disponível no window');
      console.log('💡 Solução: Verificar se o cliente Supabase está configurado corretamente');
      return;
    }
    console.log('✅ Supabase disponível');

    // 2. Verificar autenticação detalhada
    console.log('\n2. Verificando autenticação detalhada...');
    const { data: { user }, error: userError } = await window.supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Erro de autenticação:', userError);
      console.error('Detalhes:', {
        message: userError.message,
        details: userError.details,
        hint: userError.hint,
        code: userError.code
      });
      return;
    }
    
    if (!user) {
      console.error('❌ Usuário não autenticado');
      console.log('💡 Solução: Fazer login novamente');
      return;
    }
    
    console.log('✅ Usuário autenticado:');
    console.log('  - ID:', user.id);
    console.log('  - Email:', user.email);
    console.log('  - Metadata:', user.user_metadata);
    console.log('  - App Metadata:', user.app_metadata);

    // 3. Verificar se a tabela activities existe
    console.log('\n3. Verificando existência da tabela activities...');
    const { data: tableExists, error: tableExistsError } = await window.supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'activities');
    
    if (tableExistsError) {
      console.error('❌ Erro ao verificar tabela:', tableExistsError);
    } else if (tableExists.length === 0) {
      console.error('❌ Tabela activities não existe');
      console.log('💡 Solução: Criar tabela activities no Supabase');
      return;
    } else {
      console.log('✅ Tabela activities existe');
    }

    // 4. Verificar estrutura da tabela activities
    console.log('\n4. Verificando estrutura da tabela activities...');
    const { data: columns, error: columnsError } = await window.supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'activities')
      .order('ordinal_position');
    
    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError);
    } else {
      console.log('✅ Estrutura da tabela activities:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    // 5. Testar acesso à tabela activities
    console.log('\n5. Testando acesso à tabela activities...');
    const { data: testData, error: testError } = await window.supabase
      .from('activities')
      .select('id, title, created_by, company_id, created_at')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erro ao acessar tabela activities:', testError);
      console.error('Detalhes completos:', {
        message: testError.message,
        details: testError.details,
        hint: testError.hint,
        code: testError.code
      });
      
      if (testError.code === '42501') {
        console.error('🔒 ERRO DE PERMISSÃO (RLS)');
        console.log('💡 Solução: Verificar políticas RLS da tabela activities');
      } else if (testError.code === 'PGRST116') {
        console.error('❌ TABELA NÃO ENCONTRADA');
        console.log('💡 Solução: Criar tabela activities no Supabase');
      }
      
      return;
    } else {
      console.log('✅ Acesso à tabela activities OK');
      console.log('📋 Dados de teste:', testData);
    }

    // 6. Verificar perfil do usuário
    console.log('\n6. Verificando perfil do usuário...');
    
    // Tentar profiles
    const { data: profile, error: profileError } = await window.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (!profileError && profile) {
      console.log('✅ Perfil encontrado em profiles:', profile);
    } else {
      console.log('⚠️ Perfil não encontrado em profiles:', profileError?.message);
      
      // Tentar user_profiles
      const { data: userProfile, error: userProfileError } = await window.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (!userProfileError && userProfile) {
        console.log('✅ Perfil encontrado em user_profiles:', userProfile);
      } else {
        console.log('⚠️ Perfil não encontrado em user_profiles:', userProfileError?.message);
        console.log('💡 Solução: Criar perfil do usuário');
      }
    }

    // 7. Verificar políticas RLS
    console.log('\n7. Verificando políticas RLS...');
    const { data: policies, error: policiesError } = await window.supabase
      .rpc('get_table_policies', { table_name: 'activities' })
      .catch(() => {
        console.log('⚠️ Função get_table_policies não disponível, tentando método alternativo...');
        return { data: null, error: null };
      });
    
    if (policies && policies.length > 0) {
      console.log('✅ Políticas RLS encontradas:', policies);
    } else {
      console.log('⚠️ Não foi possível verificar políticas RLS');
      console.log('💡 Solução: Verificar manualmente no Supabase Dashboard');
    }

    // 8. Teste de inserção simples
    console.log('\n8. Testando inserção simples...');
    const testInsertData = {
      title: 'Teste Debug - ' + new Date().toISOString(),
      description: 'Atividade de teste para debug',
      created_by: user.id,
      company_id: null
    };
    
    console.log('📝 Dados para inserção:', testInsertData);
    
    const { data: insertResult, error: insertError } = await window.supabase
      .from('activities')
      .insert([testInsertData])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Erro ao inserir atividade:', insertError);
      console.error('Detalhes completos:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
      
      if (insertError.code === '42501') {
        console.error('🔒 ERRO DE PERMISSÃO - Política RLS bloqueando inserção');
        console.log('💡 Solução: Verificar política de INSERT na tabela activities');
      }
    } else {
      console.log('✅ Inserção de teste bem-sucedida:', insertResult);
      
      // Limpar o teste
      const { error: deleteError } = await window.supabase
        .from('activities')
        .delete()
        .eq('id', insertResult.id);
      
      if (deleteError) {
        console.log('⚠️ Erro ao limpar teste:', deleteError);
      } else {
        console.log('✅ Teste limpo com sucesso');
      }
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Executar debug
debugAuthAndTable();
