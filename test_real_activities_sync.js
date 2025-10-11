// Script para testar sincronização com dados reais do Supabase
// Execute este script no console do navegador na página de atividades

console.log('🔄 Testando sincronização com dados reais do Supabase...');

// Função para testar a busca de atividades reais
async function testRealActivitiesSync() {
  try {
    console.log('📊 Testando busca de atividades reais...');
    
    if (typeof window !== 'undefined' && window.supabase) {
      // Buscar atividades com todos os campos
      const { data, error } = await window.supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('❌ Erro ao buscar atividades:', error);
        return false;
      }
      
      console.log('✅ Atividades encontradas:', data?.length || 0);
      console.log('📋 Dados das atividades:', data);
      
      // Verificar estrutura dos dados
      if (data && data.length > 0) {
        const firstActivity = data[0];
        console.log('🔍 Estrutura da primeira atividade:', {
          id: firstActivity.id,
          title: firstActivity.title,
          status: firstActivity.status,
          owner_id: firstActivity.owner_id,
          created_at: firstActivity.created_at
        });
        
        // Verificar se tem owner_id
        if (firstActivity.owner_id) {
          console.log('✅ Campo owner_id encontrado');
        } else {
          console.log('⚠️ Campo owner_id não encontrado');
        }
        
        // Verificar status
        const validStatuses = ['todo', 'doing', 'done', 'pending', 'completed'];
        if (validStatuses.includes(firstActivity.status)) {
          console.log('✅ Status válido:', firstActivity.status);
        } else {
          console.log('⚠️ Status pode estar incorreto:', firstActivity.status);
        }
      }
      
      return true;
    } else {
      console.error('❌ Supabase não está disponível');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao testar sincronização:', error);
    return false;
  }
}

// Função para testar a criação de uma atividade real
async function testCreateRealActivity() {
  try {
    console.log('➕ Testando criação de atividade real...');
    
    if (typeof window !== 'undefined' && window.supabase) {
      // Verificar usuário autenticado
      const { data: { user }, error: userError } = await window.supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('❌ Usuário não autenticado:', userError);
        return false;
      }
      
      console.log('✅ Usuário autenticado:', user.id);
      
      // Criar atividade de teste
      const testActivity = {
        title: `Teste de Sincronização - ${new Date().toLocaleString()}`,
        description: 'Esta é uma atividade de teste para verificar a sincronização',
        type: 'task',
        priority: 'medium',
        status: 'todo',
        owner_id: user.id
      };
      
      console.log('📝 Criando atividade:', testActivity);
      
      const { data, error } = await window.supabase
        .from('activities')
        .insert([testActivity])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Erro ao criar atividade:', error);
        return false;
      }
      
      console.log('✅ Atividade criada com sucesso:', data);
      
      // Verificar se a atividade aparece na lista
      setTimeout(async () => {
        const { data: activities, error: fetchError } = await window.supabase
          .from('activities')
          .select('*')
          .eq('id', data.id)
          .single();
        
        if (fetchError) {
          console.error('❌ Erro ao buscar atividade criada:', fetchError);
        } else {
          console.log('✅ Atividade encontrada após criação:', activities);
        }
      }, 1000);
      
      return true;
    } else {
      console.error('❌ Supabase não está disponível');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao testar criação:', error);
    return false;
  }
}

// Função para testar atualização de status
async function testUpdateStatus() {
  try {
    console.log('🔄 Testando atualização de status...');
    
    if (typeof window !== 'undefined' && window.supabase) {
      // Buscar uma atividade para atualizar
      const { data: activities, error: fetchError } = await window.supabase
        .from('activities')
        .select('*')
        .limit(1);
      
      if (fetchError || !activities || activities.length === 0) {
        console.log('⚠️ Nenhuma atividade encontrada para atualizar');
        return false;
      }
      
      const activity = activities[0];
      const newStatus = activity.status === 'todo' ? 'doing' : 'todo';
      
      console.log('📝 Atualizando status de', activity.status, 'para', newStatus);
      
      const { data, error } = await window.supabase
        .from('activities')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', activity.id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Erro ao atualizar status:', error);
        return false;
      }
      
      console.log('✅ Status atualizado com sucesso:', data);
      return true;
    } else {
      console.error('❌ Supabase não está disponível');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao testar atualização:', error);
    return false;
  }
}

// Função para verificar se as atividades aparecem no frontend
function checkFrontendDisplay() {
  try {
    console.log('🎯 Verificando exibição no frontend...');
    
    // Verificar elementos do DOM
    const activityCards = document.querySelectorAll('[draggable="true"]');
    const kanbanColumns = document.querySelectorAll('[data-column-id]');
    
    console.log('📋 Cards de atividade no DOM:', activityCards.length);
    console.log('📦 Colunas do Kanban no DOM:', kanbanColumns.length);
    
    if (activityCards.length === 0) {
      console.log('⚠️ Nenhum card de atividade encontrado no DOM');
      console.log('💡 Dica: Verifique se a página está carregada e se há atividades');
      return false;
    }
    
    // Verificar se os cards têm os dados corretos
    activityCards.forEach((card, index) => {
      const title = card.querySelector('h4, .title, [data-title]');
      const status = card.getAttribute('data-status') || 'unknown';
      
      console.log(`Card ${index + 1}:`, {
        title: title?.textContent || 'Sem título',
        status: status
      });
    });
    
    console.log('✅ Atividades exibidas no frontend');
    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar frontend:', error);
    return false;
  }
}

// Função para verificar mapeamento de status
function checkStatusMapping() {
  try {
    console.log('🗺️ Verificando mapeamento de status...');
    
    const savedColumns = localStorage.getItem('kanbanColumns');
    if (savedColumns) {
      const columns = JSON.parse(savedColumns);
      console.log('📊 Colunas configuradas:', columns);
      
      // Verificar se as colunas têm os status corretos
      const statuses = columns.map(col => col.status);
      console.log('📋 Status das colunas:', statuses);
      
      // Verificar se há atividades com status que não correspondem às colunas
      const activityCards = document.querySelectorAll('[draggable="true"]');
      const activityStatuses = Array.from(activityCards).map(card => 
        card.getAttribute('data-status') || 'unknown'
      );
      
      console.log('📋 Status das atividades:', [...new Set(activityStatuses)]);
      
      // Verificar se há atividades órfãs (sem coluna correspondente)
      const orphanActivities = activityStatuses.filter(status => 
        !statuses.includes(status) && status !== 'unknown'
      );
      
      if (orphanActivities.length > 0) {
        console.log('⚠️ Atividades órfãs encontradas:', [...new Set(orphanActivities)]);
        console.log('💡 Dica: Verifique se as colunas do Kanban correspondem aos status das atividades');
      } else {
        console.log('✅ Todas as atividades têm colunas correspondentes');
      }
      
      return orphanActivities.length === 0;
    } else {
      console.log('⚠️ Nenhuma configuração de colunas salva');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar mapeamento:', error);
    return false;
  }
}

// Função principal para executar todos os testes
async function runRealDataTests() {
  console.log('🚀 Iniciando testes com dados reais...');
  
  const results = {
    sync: await testRealActivitiesSync(),
    create: await testCreateRealActivity(),
    update: await testUpdateStatus(),
    frontend: checkFrontendDisplay(),
    mapping: checkStatusMapping()
  };
  
  console.log('📊 Resultados dos testes:', results);
  
  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed) {
    console.log('✅ Todos os testes passaram! A sincronização está funcionando perfeitamente.');
  } else {
    console.log('⚠️ Alguns testes falharam. Verifique os problemas acima.');
    
    // Sugestões específicas
    if (!results.sync) {
      console.log('💡 Problema de sincronização: Verifique a conexão com o Supabase');
    }
    if (!results.create) {
      console.log('💡 Problema de criação: Verifique as permissões RLS');
    }
    if (!results.update) {
      console.log('💡 Problema de atualização: Verifique se as atividades existem');
    }
    if (!results.frontend) {
      console.log('💡 Problema de exibição: Recarregue a página ou verifique o React');
    }
    if (!results.mapping) {
      console.log('💡 Problema de mapeamento: Verifique as colunas do Kanban');
    }
  }
  
  return results;
}

// Executar testes automaticamente
runRealDataTests();

// Exportar funções para uso manual
window.testRealSync = {
  testRealActivitiesSync,
  testCreateRealActivity,
  testUpdateStatus,
  checkFrontendDisplay,
  checkStatusMapping,
  runRealDataTests
};

console.log('💡 Funções de teste disponíveis em window.testRealSync');
