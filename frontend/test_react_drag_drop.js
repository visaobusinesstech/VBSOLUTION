// Script de teste específico para o drag and drop no React
// Execute no console do navegador na página de atividades

console.log('🧪 [REACT TEST] Iniciando teste de drag and drop React...');

// Função para verificar se o React está renderizando corretamente
function checkReactRendering() {
  console.log('🔍 [REACT TEST] Verificando renderização do React...');
  
  // Verificar se há elementos do ClickUpKanban
  const kanbanContainer = document.querySelector('.flex.gap-6') || 
                         document.querySelector('[class*="ClickUpKanban"]');
  
  if (!kanbanContainer) {
    console.error('❌ [REACT TEST] Container do Kanban não encontrado');
    return false;
  }
  
  console.log('✅ [REACT TEST] Container do Kanban encontrado:', kanbanContainer);
  
  // Verificar se há colunas
  const columns = kanbanContainer.querySelectorAll('[style*="width: 280px"]');
  console.log(`📋 [REACT TEST] Colunas encontradas: ${columns.length}`);
  
  // Verificar se há cards de tarefas
  const taskCards = kanbanContainer.querySelectorAll('[draggable="true"]');
  console.log(`🎯 [REACT TEST] Cards de tarefas encontrados: ${taskCards.length}`);
  
  // Verificar se os eventos estão sendo anexados
  const hasDragStart = Array.from(taskCards).some(card => 
    card.ondragstart !== null || card.getAttribute('ondragstart') !== null
  );
  
  console.log(`🔧 [REACT TEST] Eventos dragstart anexados: ${hasDragStart}`);
  
  return {
    container: kanbanContainer,
    columns: columns.length,
    taskCards: taskCards.length,
    hasDragStart
  };
}

// Função para verificar se os dados estão sendo passados corretamente
function checkDataFlow() {
  console.log('📊 [REACT TEST] Verificando fluxo de dados...');
  
  // Verificar se há atividades carregadas
  const activities = window.activities || [];
  console.log(`📋 [REACT TEST] Atividades carregadas: ${activities.length}`);
  
  if (activities.length > 0) {
    console.log('📋 [REACT TEST] Primeira atividade:', activities[0]);
  }
  
  // Verificar se há colunas do Kanban
  const kanbanColumns = window.kanbanColumns || [];
  console.log(`📋 [REACT TEST] Colunas do Kanban: ${kanbanColumns.length}`);
  
  if (kanbanColumns.length > 0) {
    console.log('📋 [REACT TEST] Colunas:', kanbanColumns);
  }
  
  return {
    activities: activities.length,
    kanbanColumns: kanbanColumns.length
  };
}

// Função para simular drag and drop real
function simulateRealDragAndDrop() {
  console.log('🎮 [REACT TEST] Simulando drag and drop real...');
  
  const kanbanContainer = document.querySelector('.flex.gap-6') || 
                         document.querySelector('[class*="ClickUpKanban"]');
  
  if (!kanbanContainer) {
    console.error('❌ [REACT TEST] Container não encontrado para simulação');
    return;
  }
  
  const taskCards = kanbanContainer.querySelectorAll('[draggable="true"]');
  const columns = kanbanContainer.querySelectorAll('[style*="width: 280px"]');
  
  if (taskCards.length === 0) {
    console.warn('⚠️ [REACT TEST] Nenhum card encontrado para testar');
    return;
  }
  
  if (columns.length < 2) {
    console.warn('⚠️ [REACT TEST] Precisa de pelo menos 2 colunas');
    return;
  }
  
  const sourceCard = taskCards[0];
  const targetColumn = columns[1];
  
  console.log('🎯 [REACT TEST] Testando drag do card:', sourceCard);
  console.log('🎯 [REACT TEST] Para coluna:', targetColumn);
  
  // Verificar se o card tem os atributos corretos
  const taskId = sourceCard.getAttribute('data-task-id') || 
                 sourceCard.querySelector('[data-task-id]')?.getAttribute('data-task-id');
  const taskTitle = sourceCard.textContent?.trim();
  
  console.log('🔍 [REACT TEST] Dados do card:', { taskId, taskTitle });
  
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
  
  // Configurar dataTransfer
  const dragData = {
    task: {
      id: taskId || 'test-task-id',
      title: taskTitle || 'Test Task',
      status: 'pending'
    },
    sourceColumnId: 'todo'
  };
  
  dropEvent.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  
  // Disparar eventos
  console.log('🚀 [REACT TEST] Disparando dragstart...');
  sourceCard.dispatchEvent(dragStartEvent);
  
  console.log('🎯 [REACT TEST] Disparando dragover...');
  targetColumn.dispatchEvent(dragOverEvent);
  
  console.log('🏁 [REACT TEST] Disparando drop...');
  targetColumn.dispatchEvent(dropEvent);
  
  console.log('✅ [REACT TEST] Simulação concluída');
}

// Função para verificar logs do React
function checkReactLogs() {
  console.log('📊 [REACT TEST] Verificando logs do React...');
  
  // Interceptar console.log para capturar logs de drag and drop
  const originalLog = console.log;
  const dragLogs = [];
  
  console.log = function(...args) {
    const message = args.join(' ');
    if (message.includes('[DRAG]') || message.includes('[DROP]') || message.includes('[KANBAN]')) {
      dragLogs.push(message);
    }
    originalLog.apply(console, args);
  };
  
  // Restaurar console.log após 10 segundos
  setTimeout(() => {
    console.log = originalLog;
    console.log('📋 [REACT TEST] Logs capturados:', dragLogs);
    
    if (dragLogs.length === 0) {
      console.warn('⚠️ [REACT TEST] Nenhum log de drag and drop encontrado - possível problema na implementação');
    }
  }, 10000);
}

// Função para verificar se há erros no React
function checkReactErrors() {
  console.log('🔍 [REACT TEST] Verificando erros do React...');
  
  // Verificar se há erros no console
  const originalError = console.error;
  const errors = [];
  
  console.error = function(...args) {
    errors.push(args.join(' '));
    originalError.apply(console, args);
  };
  
  // Restaurar console.error após 5 segundos
  setTimeout(() => {
    console.error = originalError;
    if (errors.length > 0) {
      console.log('❌ [REACT TEST] Erros encontrados:', errors);
    } else {
      console.log('✅ [REACT TEST] Nenhum erro encontrado');
    }
  }, 5000);
}

// Função principal de teste
function runReactDragDropTest() {
  console.log('🧪 [REACT TEST] ===== INICIANDO TESTE COMPLETO =====');
  
  // 1. Verificar renderização
  const rendering = checkReactRendering();
  if (!rendering) {
    console.error('❌ [REACT TEST] Teste falhou: renderização incorreta');
    return;
  }
  
  // 2. Verificar fluxo de dados
  const dataFlow = checkDataFlow();
  console.log('📊 [REACT TEST] Fluxo de dados:', dataFlow);
  
  // 3. Verificar logs
  checkReactLogs();
  
  // 4. Verificar erros
  checkReactErrors();
  
  // 5. Simular drag and drop
  setTimeout(() => {
    simulateRealDragAndDrop();
  }, 2000);
  
  console.log('✅ [REACT TEST] Teste iniciado - aguarde os resultados...');
}

// Exportar funções
window.reactDragDropTest = {
  checkReactRendering,
  checkDataFlow,
  simulateRealDragAndDrop,
  checkReactLogs,
  checkReactErrors,
  runReactDragDropTest
};

// Executar teste automaticamente
runReactDragDropTest();
