// Script de teste para verificar se o drag and drop está funcionando
// Execute no console do navegador na página de atividades

console.log('🧪 [TEST] Iniciando teste de drag and drop...');

// Função para testar se os elementos do Kanban estão presentes
function testKanbanElements() {
  console.log('🔍 [TEST] Verificando elementos do Kanban...');
  
  // Verificar se o ClickUpKanban está presente
  const kanbanContainer = document.querySelector('[class*="ClickUpKanban"]') || 
                         document.querySelector('.flex.overflow-x-auto') ||
                         document.querySelector('.flex.gap-6');
  
  if (!kanbanContainer) {
    console.error('❌ [TEST] Container do Kanban não encontrado');
    return false;
  }
  
  console.log('✅ [TEST] Container do Kanban encontrado:', kanbanContainer);
  
  // Verificar se há colunas
  const columns = kanbanContainer.querySelectorAll('[style*="width: 280px"]');
  console.log(`📋 [TEST] Colunas encontradas: ${columns.length}`);
  
  // Verificar se há cards de tarefas
  const taskCards = kanbanContainer.querySelectorAll('[draggable="true"]');
  console.log(`🎯 [TEST] Cards de tarefas encontrados: ${taskCards.length}`);
  
  return {
    container: kanbanContainer,
    columns: columns.length,
    taskCards: taskCards.length
  };
}

// Função para simular drag and drop
function simulateDragAndDrop() {
  console.log('🎮 [TEST] Simulando drag and drop...');
  
  const kanbanContainer = document.querySelector('[class*="ClickUpKanban"]') || 
                         document.querySelector('.flex.overflow-x-auto') ||
                         document.querySelector('.flex.gap-6');
  
  if (!kanbanContainer) {
    console.error('❌ [TEST] Container do Kanban não encontrado para simulação');
    return;
  }
  
  const taskCards = kanbanContainer.querySelectorAll('[draggable="true"]');
  const columns = kanbanContainer.querySelectorAll('[style*="width: 280px"]');
  
  if (taskCards.length === 0) {
    console.warn('⚠️ [TEST] Nenhum card de tarefa encontrado para testar');
    return;
  }
  
  if (columns.length < 2) {
    console.warn('⚠️ [TEST] Precisa de pelo menos 2 colunas para testar drag and drop');
    return;
  }
  
  const sourceCard = taskCards[0];
  const targetColumn = columns[1];
  
  console.log('🎯 [TEST] Testando drag do card:', sourceCard);
  console.log('🎯 [TEST] Para coluna:', targetColumn);
  
  // Simular eventos de drag
  const dragStartEvent = new DragEvent('dragstart', {
    bubbles: true,
    cancelable: true,
    dataTransfer: new DataTransfer()
  });
  
  const dragOverEvent = new DragEvent('dragover', {
    bubbles: true,
    cancelable: true,
    dataTransfer: new DataTransfer()
  });
  
  const dropEvent = new DragEvent('drop', {
    bubbles: true,
    cancelable: true,
    dataTransfer: new DataTransfer()
  });
  
  // Configurar dataTransfer para o drop
  const dragData = {
    task: {
      id: sourceCard.getAttribute('data-task-id') || 'test-task-id',
      title: sourceCard.textContent?.trim() || 'Test Task'
    },
    sourceColumnId: 'todo'
  };
  
  dropEvent.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  
  // Disparar eventos
  console.log('🚀 [TEST] Disparando dragstart...');
  sourceCard.dispatchEvent(dragStartEvent);
  
  console.log('🎯 [TEST] Disparando dragover...');
  targetColumn.dispatchEvent(dragOverEvent);
  
  console.log('🏁 [TEST] Disparando drop...');
  targetColumn.dispatchEvent(dropEvent);
  
  console.log('✅ [TEST] Simulação de drag and drop concluída');
}

// Função para verificar logs do console
function checkConsoleLogs() {
  console.log('📊 [TEST] Verificando logs do console...');
  
  // Verificar se há logs de drag and drop
  const originalLog = console.log;
  const dragLogs = [];
  
  console.log = function(...args) {
    const message = args.join(' ');
    if (message.includes('[DRAG]') || message.includes('[DROP]') || message.includes('[KANBAN]')) {
      dragLogs.push(message);
    }
    originalLog.apply(console, args);
  };
  
  // Restaurar console.log após 5 segundos
  setTimeout(() => {
    console.log = originalLog;
    console.log('📋 [TEST] Logs de drag and drop capturados:', dragLogs);
  }, 5000);
}

// Função principal de teste
function runDragDropTest() {
  console.log('🧪 [TEST] ===== INICIANDO TESTE COMPLETO DE DRAG AND DROP =====');
  
  // 1. Verificar elementos
  const elements = testKanbanElements();
  if (!elements) {
    console.error('❌ [TEST] Teste falhou: elementos não encontrados');
    return;
  }
  
  // 2. Verificar logs
  checkConsoleLogs();
  
  // 3. Simular drag and drop
  setTimeout(() => {
    simulateDragAndDrop();
  }, 1000);
  
  console.log('✅ [TEST] Teste de drag and drop iniciado');
}

// Exportar funções para uso manual
window.testDragDrop = {
  testKanbanElements,
  simulateDragAndDrop,
  checkConsoleLogs,
  runDragDropTest
};

// Executar teste automaticamente
runDragDropTest();
