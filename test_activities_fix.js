// Script de teste para verificar se as atividades estão funcionando
// Execute este script no console do navegador

console.log('🧪 [TESTE] Iniciando teste das atividades...');

// Função para testar criação de atividade
async function testCreateActivity() {
  console.log('📋 [TESTE] Testando criação de atividade...');
  
  try {
    // Verificar se o usuário está autenticado
    const { data: { user }, error: userError } = await window.supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ [TESTE] Usuário não autenticado:', userError);
      return false;
    }
    
    console.log('✅ [TESTE] Usuário autenticado:', { id: user.id, email: user.email });
    
    // Criar atividade de teste
    const testActivity = {
      title: 'Teste de Atividade',
      description: 'Atividade criada para testar o sistema',
      type: 'task',
      priority: 'medium',
      status: 'pending'
    };
    
    console.log('🔍 [TESTE] Criando atividade:', testActivity);
    
    const { data, error } = await window.supabase
      .from('activities')
      .insert([{
        ...testActivity,
        owner_id: user.id
      }])
      .select()
      .single();
    
    if (error) {
      console.error('❌ [TESTE] Erro ao criar atividade:', error);
      return false;
    }
    
    console.log('✅ [TESTE] Atividade criada com sucesso:', data);
    
    // Testar drag and drop (mover para in_progress)
    console.log('🎯 [TESTE] Testando drag and drop...');
    
    const { data: updateData, error: updateError } = await window.supabase
      .from('activities')
      .update({ 
        status: 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', data.id)
      .eq('owner_id', user.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ [TESTE] Erro ao mover atividade:', updateError);
      return false;
    }
    
    console.log('✅ [TESTE] Atividade movida com sucesso:', updateData);
    
    // Limpar atividade de teste
    await window.supabase
      .from('activities')
      .delete()
      .eq('id', data.id);
    
    console.log('🧹 [TESTE] Atividade de teste removida');
    return true;
    
  } catch (error) {
    console.error('❌ [TESTE] Erro inesperado:', error);
    return false;
  }
}

// Função para testar carregamento de atividades
async function testLoadActivities() {
  console.log('📋 [TESTE] Testando carregamento de atividades...');
  
  try {
    const { data: { user }, error: userError } = await window.supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ [TESTE] Usuário não autenticado');
      return false;
    }
    
    const { data, error } = await window.supabase
      .from('activities')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ [TESTE] Erro ao carregar atividades:', error);
      return false;
    }
    
    console.log('✅ [TESTE] Atividades carregadas:', data.length);
    
    // Verificar distribuição por status
    const statusCount = data.reduce((acc, activity) => {
      acc[activity.status] = (acc[activity.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📊 [TESTE] Distribuição por status:', statusCount);
    return true;
    
  } catch (error) {
    console.error('❌ [TESTE] Erro ao carregar atividades:', error);
    return false;
  }
}

// Função para testar F5 (recarregamento)
async function testF5Reload() {
  console.log('📋 [TESTE] Testando persistência após F5...');
  
  try {
    // Simular verificação se as atividades persistem após reload
    const { data, error } = await window.supabase
      .from('activities')
      .select('id, title, status, owner_id')
      .eq('owner_id', (await window.supabase.auth.getUser()).data.user?.id);
    
    if (error) {
      console.error('❌ [TESTE] Erro ao verificar persistência:', error);
      return false;
    }
    
    console.log('✅ [TESTE] Atividades persistem após reload:', data.length);
    
    // Verificar se há atividades com status válidos
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled', 'overdue'];
    const invalidActivities = data.filter(a => !validStatuses.includes(a.status));
    
    if (invalidActivities.length > 0) {
      console.warn('⚠️ [TESTE] Atividades com status inválido:', invalidActivities);
    } else {
      console.log('✅ [TESTE] Todas as atividades têm status válidos');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ [TESTE] Erro ao testar F5:', error);
    return false;
  }
}

// Executar todos os testes
async function runAllTests() {
  console.log('🚀 [TESTE] Executando todos os testes...');
  
  const results = {
    create: await testCreateActivity(),
    load: await testLoadActivities(),
    f5: await testF5Reload()
  };
  
  console.log('📋 [TESTE] Resultados dos testes:', results);
  
  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed) {
    console.log('🎉 [TESTE] Todos os testes passaram! O sistema deve estar funcionando.');
  } else {
    console.log('⚠️ [TESTE] Alguns testes falharam. Verifique os logs acima.');
  }
  
  return results;
}

// Exportar funções para uso manual
window.testActivities = {
  runAllTests,
  testCreateActivity,
  testLoadActivities,
  testF5Reload
};

console.log('✅ [TESTE] Script de teste carregado. Use testActivities.runAllTests() para executar os testes.');
