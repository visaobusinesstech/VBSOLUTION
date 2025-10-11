// Script de debug para verificar problemas de autenticação
// Execute este script no console do navegador

console.log('🔍 [DEBUG] Iniciando verificação de autenticação...');

// Função para verificar o estado da autenticação
async function debugAuthState() {
  try {
    console.log('📋 [DEBUG] Verificando estado da autenticação...');
    
    // Verificar se o Supabase está disponível
    if (typeof window.supabase === 'undefined') {
      console.error('❌ [DEBUG] Supabase não está disponível globalmente');
      return false;
    }
    
    // Verificar sessão atual
    const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ [DEBUG] Erro ao obter sessão:', sessionError);
      return false;
    }
    
    console.log('✅ [DEBUG] Sessão obtida:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    });
    
    if (!session || !session.user) {
      console.warn('⚠️ [DEBUG] Nenhuma sessão ativa encontrada');
      return false;
    }
    
    if (!session.user.id) {
      console.error('❌ [DEBUG] Usuário sem ID');
      return false;
    }
    
    console.log('✅ [DEBUG] Usuário autenticado corretamente');
    return true;
    
  } catch (error) {
    console.error('❌ [DEBUG] Erro inesperado:', error);
    return false;
  }
}

// Função para verificar a estrutura da tabela activities
async function debugActivitiesTable() {
  try {
    console.log('📋 [DEBUG] Verificando estrutura da tabela activities...');
    
    const { data, error } = await window.supabase
      .from('activities')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ [DEBUG] Erro ao acessar tabela activities:', error);
      return false;
    }
    
    console.log('✅ [DEBUG] Tabela activities acessível');
    return true;
    
  } catch (error) {
    console.error('❌ [DEBUG] Erro ao verificar tabela:', error);
    return false;
  }
}

// Função para testar criação de atividade
async function testCreateActivity() {
  try {
    console.log('📋 [DEBUG] Testando criação de atividade...');
    
    const { data: { user }, error: userError } = await window.supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ [DEBUG] Erro ao obter usuário:', userError);
      return false;
    }
    
    console.log('✅ [DEBUG] Usuário obtido:', { id: user.id, email: user.email });
    
    // Tentar criar uma atividade de teste
    const testActivity = {
      title: 'Teste de Debug',
      description: 'Atividade criada para testar o sistema',
      type: 'task',
      priority: 'medium',
      status: 'pending',
      created_by: user.id
    };
    
    console.log('🔍 [DEBUG] Dados da atividade de teste:', testActivity);
    
    const { data, error } = await window.supabase
      .from('activities')
      .insert([testActivity])
      .select()
      .single();
    
    if (error) {
      console.error('❌ [DEBUG] Erro ao criar atividade:', error);
      return false;
    }
    
    console.log('✅ [DEBUG] Atividade criada com sucesso:', data);
    
    // Limpar atividade de teste
    await window.supabase
      .from('activities')
      .delete()
      .eq('id', data.id);
    
    console.log('🧹 [DEBUG] Atividade de teste removida');
    return true;
    
  } catch (error) {
    console.error('❌ [DEBUG] Erro ao testar criação:', error);
    return false;
  }
}

// Função principal de debug
async function runDebug() {
  console.log('🚀 [DEBUG] Iniciando debug completo...');
  
  const results = {
    auth: await debugAuthState(),
    table: await debugActivitiesTable(),
    create: await testCreateActivity()
  };
  
  console.log('📋 [DEBUG] Resultados do debug:', results);
  
  if (results.auth && results.table && results.create) {
    console.log('🎉 [DEBUG] Todos os testes passaram! O sistema deve estar funcionando.');
  } else {
    console.log('⚠️ [DEBUG] Alguns testes falharam. Verifique os logs acima.');
  }
  
  return results;
}

// Exportar funções para uso manual
window.debugAuth = {
  runDebug,
  debugAuthState,
  debugActivitiesTable,
  testCreateActivity
};

console.log('✅ [DEBUG] Script de debug carregado. Use debugAuth.runDebug() para executar todos os testes.');
