// Script para testar a sincronização de atividades com o Supabase
// Execute este script no console do navegador na página de atividades

console.log('🔄 Testando sincronização de atividades com Supabase...');

// Função para testar a conexão com Supabase
async function testSupabaseConnection() {
  try {
    console.log('🔌 Testando conexão com Supabase...');
    
    if (typeof window !== 'undefined' && window.supabase) {
      const { data, error } = await window.supabase
        .from('activities')
        .select('*')
        .limit(5);
      
      if (error) {
        console.error('❌ Erro na conexão:', error);
        return false;
      }
      
      console.log('✅ Conexão com Supabase OK');
      console.log('📊 Dados encontrados:', data?.length || 0);
      console.log('📋 Primeiras atividades:', data);
      return true;
    } else {
      console.error('❌ Supabase não está disponível');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error);
    return false;
  }
}

// Função para verificar se as atividades estão sendo carregadas no frontend
function checkFrontendActivities() {
  try {
    console.log('🎯 Verificando atividades no frontend...');
    
    // Verificar se o React está disponível
    if (typeof window !== 'undefined' && window.React) {
      console.log('✅ React está disponível');
    } else {
      console.log('❌ React não está disponível');
      return false;
    }
    
    // Verificar elementos do DOM
    const activityCards = document.querySelectorAll('[data-activity-id], [draggable="true"]');
    const kanbanColumns = document.querySelectorAll('[data-column-id]');
    
    console.log('📋 Cards de atividade encontrados:', activityCards.length);
    console.log('📦 Colunas do Kanban encontradas:', kanbanColumns.length);
    
    if (activityCards.length === 0) {
      console.log('⚠️ Nenhum card de atividade encontrado no DOM');
      return false;
    }
    
    console.log('✅ Atividades encontradas no frontend');
    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar frontend:', error);
    return false;
  }
}

// Função para verificar o mapeamento de status
function checkStatusMapping() {
  try {
    console.log('🗺️ Verificando mapeamento de status...');
    
    // Verificar se as colunas do Kanban estão configuradas corretamente
    const savedColumns = localStorage.getItem('kanbanColumns');
    if (savedColumns) {
      const columns = JSON.parse(savedColumns);
      console.log('📊 Colunas salvas:', columns);
      
      const expectedStatuses = ['todo', 'doing', 'done'];
      const columnStatuses = columns.map(col => col.status);
      
      console.log('🎯 Status esperados:', expectedStatuses);
      console.log('📋 Status encontrados:', columnStatuses);
      
      const hasCorrectStatuses = expectedStatuses.every(status => 
        columnStatuses.includes(status)
      );
      
      if (hasCorrectStatuses) {
        console.log('✅ Mapeamento de status correto');
      } else {
        console.log('⚠️ Mapeamento de status pode estar incorreto');
      }
      
      return hasCorrectStatuses;
    } else {
      console.log('⚠️ Nenhuma configuração de colunas salva');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar mapeamento:', error);
    return false;
  }
}

// Função para verificar se há problemas de autenticação
async function checkAuthentication() {
  try {
    console.log('🔐 Verificando autenticação...');
    
    if (typeof window !== 'undefined' && window.supabase) {
      const { data: { user }, error } = await window.supabase.auth.getUser();
      
      if (error) {
        console.error('❌ Erro de autenticação:', error);
        return false;
      }
      
      if (!user) {
        console.log('⚠️ Usuário não autenticado');
        return false;
      }
      
      console.log('✅ Usuário autenticado:', user.id);
      return true;
    } else {
      console.log('❌ Supabase não disponível');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar autenticação:', error);
    return false;
  }
}

// Função para verificar se há problemas de RLS (Row Level Security)
async function checkRLS() {
  try {
    console.log('🛡️ Verificando RLS (Row Level Security)...');
    
    if (typeof window !== 'undefined' && window.supabase) {
      const { data, error } = await window.supabase
        .from('activities')
        .select('id, title, status, created_by')
        .limit(1);
      
      if (error) {
        console.error('❌ Erro de RLS:', error);
        console.log('💡 Possível problema: Políticas RLS podem estar bloqueando o acesso');
        return false;
      }
      
      console.log('✅ RLS configurado corretamente');
      console.log('📊 Dados acessíveis:', data);
      return true;
    } else {
      console.log('❌ Supabase não disponível');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar RLS:', error);
    return false;
  }
}

// Função para forçar recarregamento das atividades
async function forceReloadActivities() {
  try {
    console.log('🔄 Forçando recarregamento das atividades...');
    
    // Verificar se há uma função de refetch disponível
    if (typeof window !== 'undefined' && window.React) {
      console.log('💡 Dica: Use o botão de refresh na página ou recarregue a página');
    }
    
    // Tentar recarregar a página
    console.log('🔄 Recarregando página...');
    window.location.reload();
    
  } catch (error) {
    console.error('❌ Erro ao forçar recarregamento:', error);
  }
}

// Função principal para executar todos os testes
async function runSyncTests() {
  console.log('🚀 Iniciando testes de sincronização...');
  
  const results = {
    supabase: await testSupabaseConnection(),
    frontend: checkFrontendActivities(),
    statusMapping: checkStatusMapping(),
    auth: await checkAuthentication(),
    rls: await checkRLS()
  };
  
  console.log('📊 Resultados dos testes:', results);
  
  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed) {
    console.log('✅ Todos os testes passaram! A sincronização está funcionando.');
  } else {
    console.log('⚠️ Alguns testes falharam. Verifique os problemas acima.');
    
    // Sugestões de correção
    if (!results.supabase) {
      console.log('💡 Solução: Verifique a configuração do Supabase');
    }
    if (!results.frontend) {
      console.log('💡 Solução: Verifique se as atividades estão sendo renderizadas');
    }
    if (!results.statusMapping) {
      console.log('💡 Solução: Verifique o mapeamento de status das colunas');
    }
    if (!results.auth) {
      console.log('💡 Solução: Faça login novamente');
    }
    if (!results.rls) {
      console.log('💡 Solução: Execute o script fix_activities_table_structure.sql');
    }
  }
  
  return results;
}

// Executar testes automaticamente
runSyncTests();

// Exportar funções para uso manual
window.testSync = {
  testSupabaseConnection,
  checkFrontendActivities,
  checkStatusMapping,
  checkAuthentication,
  checkRLS,
  forceReloadActivities,
  runSyncTests
};

console.log('💡 Funções de teste disponíveis em window.testSync');
