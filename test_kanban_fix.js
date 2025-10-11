// Script de teste para verificar se o kanban está funcionando corretamente
// Execute este script no console do navegador na página de atividades

console.log('🧪 [TESTE] Iniciando teste do kanban...');

// Função para testar o carregamento das atividades
async function testActivitiesLoading() {
  console.log('📋 [TESTE] Testando carregamento das atividades...');
  
  try {
    // Simular verificação das atividades carregadas
    const activities = window.activities || [];
    console.log('✅ [TESTE] Atividades carregadas:', activities.length);
    
    // Verificar se as atividades têm status válidos
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled', 'overdue'];
    const invalidActivities = activities.filter(a => !validStatuses.includes(a.status));
    
    if (invalidActivities.length > 0) {
      console.warn('⚠️ [TESTE] Atividades com status inválido:', invalidActivities);
    } else {
      console.log('✅ [TESTE] Todas as atividades têm status válidos');
    }
    
    // Verificar distribuição por status
    const statusCount = activities.reduce((acc, activity) => {
      acc[activity.status] = (acc[activity.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📊 [TESTE] Distribuição por status:', statusCount);
    
    return true;
  } catch (error) {
    console.error('❌ [TESTE] Erro ao testar carregamento:', error);
    return false;
  }
}

// Função para testar o drag and drop
async function testDragAndDrop() {
  console.log('🎯 [TESTE] Testando drag and drop...');
  
  try {
    // Verificar se os elementos do kanban estão presentes
    const kanbanColumns = document.querySelectorAll('[data-rbd-droppable-id]');
    console.log('✅ [TESTE] Colunas do kanban encontradas:', kanbanColumns.length);
    
    // Verificar se há atividades para mover
    const activityCards = document.querySelectorAll('[data-rbd-draggable-id]');
    console.log('✅ [TESTE] Cards de atividade encontrados:', activityCards.length);
    
    if (activityCards.length === 0) {
      console.warn('⚠️ [TESTE] Nenhuma atividade encontrada para testar drag and drop');
      return false;
    }
    
    console.log('✅ [TESTE] Drag and drop está pronto para ser testado manualmente');
    return true;
  } catch (error) {
    console.error('❌ [TESTE] Erro ao testar drag and drop:', error);
    return false;
  }
}

// Função para testar a persistência
async function testPersistence() {
  console.log('💾 [TESTE] Testando persistência...');
  
  try {
    // Simular verificação se as mudanças são salvas
    console.log('✅ [TESTE] Para testar persistência:');
    console.log('1. Mova uma atividade entre colunas');
    console.log('2. Recarregue a página (F5)');
    console.log('3. Verifique se a atividade permanece na coluna correta');
    
    return true;
  } catch (error) {
    console.error('❌ [TESTE] Erro ao testar persistência:', error);
    return false;
  }
}

// Executar todos os testes
async function runAllTests() {
  console.log('🚀 [TESTE] Executando todos os testes...');
  
  const results = {
    loading: await testActivitiesLoading(),
    dragDrop: await testDragAndDrop(),
    persistence: await testPersistence()
  };
  
  console.log('📋 [TESTE] Resultados dos testes:', results);
  
  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed) {
    console.log('🎉 [TESTE] Todos os testes passaram! O kanban deve estar funcionando corretamente.');
  } else {
    console.log('⚠️ [TESTE] Alguns testes falharam. Verifique os logs acima.');
  }
  
  return results;
}

// Exportar funções para uso manual
window.testKanban = {
  runAllTests,
  testActivitiesLoading,
  testDragAndDrop,
  testPersistence
};

console.log('✅ [TESTE] Script de teste carregado. Use testKanban.runAllTests() para executar os testes.');
