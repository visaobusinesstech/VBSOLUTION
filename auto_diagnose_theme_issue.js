// Script automatizado para diagnosticar o problema de salvamento de tema
// Execute este script no console do navegador

console.log('🔍 DIAGNÓSTICO AUTOMATIZADO: Problema de Salvamento de Tema');
console.log('='.repeat(60));

// Função para aguardar um tempo
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Função para testar conexão com Supabase
async function testSupabaseConnection() {
  console.log('\n1️⃣ TESTANDO CONEXÃO COM SUPABASE...');
  
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ ERRO DE CONEXÃO:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Conexão com Supabase: OK');
    return { success: true };
  } catch (err) {
    console.error('❌ ERRO DE CONEXÃO:', err);
    return { success: false, error: err.message };
  }
}

// Função para verificar colunas de tema
async function checkThemeColumns() {
  console.log('\n2️⃣ VERIFICANDO COLUNAS DE TEMA...');
  
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('sidebar_color, topbar_color, button_color')
      .limit(1);
    
    if (error) {
      console.error('❌ ERRO AO VERIFICAR COLUNAS:', error);
      console.error('Código do erro:', error.code);
      console.error('Detalhes:', error.details);
      return { success: false, error: error.message };
    }
    
    const columns = Object.keys(data[0] || {});
    console.log('✅ Colunas encontradas:', columns);
    
    const hasThemeColumns = columns.includes('sidebar_color') && 
                           columns.includes('topbar_color') && 
                           columns.includes('button_color');
    
    if (hasThemeColumns) {
      console.log('✅ Todas as colunas de tema existem');
      return { success: true, columns };
    } else {
      console.log('❌ Colunas de tema não encontradas');
      return { success: false, error: 'Colunas de tema não existem' };
    }
  } catch (err) {
    console.error('❌ ERRO AO VERIFICAR COLUNAS:', err);
    return { success: false, error: err.message };
  }
}

// Função para testar salvamento direto
async function testDirectSave() {
  console.log('\n3️⃣ TESTANDO SALVAMENTO DIRETO...');
  
  try {
    // Buscar usuário atual
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.error('❌ Usuário não logado');
      return { success: false, error: 'Usuário não logado' };
    }
    
    const userId = user.user.id;
    console.log('👤 User ID:', userId);
    
    // Dados de teste
    const testData = {
      company_id: '11111111-1111-1111-1111-111111111111',
      company_name: 'Teste Diagnóstico',
      sidebar_color: '#ff6b6b',
      topbar_color: '#4ecdc4',
      button_color: '#45b7d1',
      updated_at: new Date().toISOString()
    };
    
    console.log('📝 Dados de teste:', testData);
    
    // Tentar upsert
    const { data, error } = await supabase
      .from('company_settings')
      .upsert(testData)
      .select();
    
    if (error) {
      console.error('❌ ERRO NO SALVAMENTO DIRETO:', error);
      console.error('Código do erro:', error.code);
      console.error('Detalhes:', error.details);
      console.error('Hint:', error.hint);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Salvamento direto: OK');
    console.log('Dados salvos:', data[0]);
    return { success: true, data: data[0] };
  } catch (err) {
    console.error('❌ ERRO NO SALVAMENTO DIRETO:', err);
    return { success: false, error: err.message };
  }
}

// Função para verificar dados salvos
async function checkSavedData() {
  console.log('\n4️⃣ VERIFICANDO DADOS SALVOS...');
  
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(3);
    
    if (error) {
      console.error('❌ ERRO AO BUSCAR DADOS:', error);
      return { success: false, error: error.message };
    }
    
    console.log('📋 Dados encontrados no banco:');
    data.forEach((record, index) => {
      console.log(`${index + 1}. ID: ${record.id}`);
      console.log(`   Company: ${record.company_name}`);
      console.log(`   Sidebar: ${record.sidebar_color}`);
      console.log(`   Topbar: ${record.topbar_color}`);
      console.log(`   Button: ${record.button_color}`);
      console.log(`   Updated: ${record.updated_at}`);
      console.log('---');
    });
    
    return { success: true, data };
  } catch (err) {
    console.error('❌ ERRO AO VERIFICAR DADOS:', err);
    return { success: false, error: err.message };
  }
}

// Função para testar a função saveCompanySettings
async function testSaveCompanySettingsFunction() {
  console.log('\n5️⃣ TESTANDO FUNÇÃO saveCompanySettings...');
  
  try {
    // Verificar se a função está disponível globalmente
    if (typeof window.testSaveCompanySettings === 'function') {
      const testData = {
        company_name: 'Teste Função',
        sidebar_color: '#ff0000',
        topbar_color: '#00ff00',
        button_color: '#0000ff'
      };
      
      console.log('📝 Testando com dados:', testData);
      
      const result = await window.testSaveCompanySettings(testData);
      console.log('✅ Resultado da função:', result);
      return { success: result.success, data: result };
    } else {
      console.log('❌ Função saveCompanySettings não encontrada globalmente');
      return { success: false, error: 'Função não encontrada' };
    }
  } catch (err) {
    console.error('❌ ERRO AO TESTAR FUNÇÃO:', err);
    return { success: false, error: err.message };
  }
}

// Função para verificar logs de erro
function checkErrorLogs() {
  console.log('\n6️⃣ VERIFICANDO LOGS DE ERRO...');
  
  const originalError = console.error;
  const errors = [];
  
  console.error = function(...args) {
    errors.push(args.join(' '));
    originalError.apply(console, args);
  };
  
  // Aguardar um pouco para capturar erros
  setTimeout(() => {
    console.error = originalError;
    
    if (errors.length === 0) {
      console.log('✅ Nenhum erro detectado nos logs');
    } else {
      console.log('❌ Erros detectados nos logs:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
  }, 2000);
}

// Função principal de diagnóstico
async function runAutoDiagnosis() {
  console.log('🚀 INICIANDO DIAGNÓSTICO AUTOMATIZADO...');
  console.log('⏰ Aguarde enquanto os testes são executados...\n');
  
  const results = {};
  
  // Teste 1: Conexão
  results.connection = await testSupabaseConnection();
  await wait(1000);
  
  // Teste 2: Colunas
  results.columns = await checkThemeColumns();
  await wait(1000);
  
  // Teste 3: Salvamento direto
  results.directSave = await testDirectSave();
  await wait(1000);
  
  // Teste 4: Dados salvos
  results.savedData = await checkSavedData();
  await wait(1000);
  
  // Teste 5: Função saveCompanySettings
  results.functionTest = await testSaveCompanySettingsFunction();
  await wait(1000);
  
  // Teste 6: Logs de erro
  checkErrorLogs();
  await wait(3000);
  
  // Resumo dos resultados
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DO DIAGNÓSTICO:');
  console.log('='.repeat(60));
  
  console.log('1. Conexão Supabase:', results.connection.success ? '✅ OK' : '❌ FALHOU');
  if (!results.connection.success) {
    console.log('   Erro:', results.connection.error);
  }
  
  console.log('2. Colunas de tema:', results.columns.success ? '✅ OK' : '❌ FALHOU');
  if (!results.columns.success) {
    console.log('   Erro:', results.columns.error);
  }
  
  console.log('3. Salvamento direto:', results.directSave.success ? '✅ OK' : '❌ FALHOU');
  if (!results.directSave.success) {
    console.log('   Erro:', results.directSave.error);
  }
  
  console.log('4. Dados salvos:', results.savedData.success ? '✅ OK' : '❌ FALHOU');
  if (!results.savedData.success) {
    console.log('   Erro:', results.savedData.error);
  }
  
  console.log('5. Função saveCompanySettings:', results.functionTest.success ? '✅ OK' : '❌ FALHOU');
  if (!results.functionTest.success) {
    console.log('   Erro:', results.functionTest.error);
  }
  
  // Diagnóstico final
  console.log('\n' + '='.repeat(60));
  console.log('🎯 DIAGNÓSTICO FINAL:');
  console.log('='.repeat(60));
  
  if (!results.connection.success) {
    console.log('❌ PROBLEMA: Não consegue conectar com Supabase');
    console.log('💡 SOLUÇÃO: Verifique a configuração do Supabase');
  } else if (!results.columns.success) {
    console.log('❌ PROBLEMA: Colunas de tema não existem no banco');
    console.log('💡 SOLUÇÃO: Execute o script SQL para criar as colunas');
  } else if (!results.directSave.success) {
    console.log('❌ PROBLEMA: Erro ao salvar diretamente no banco');
    console.log('💡 SOLUÇÃO: Verifique permissões RLS ou estrutura da tabela');
  } else if (!results.savedData.success) {
    console.log('❌ PROBLEMA: Não consegue buscar dados salvos');
    console.log('💡 SOLUÇÃO: Verifique permissões de leitura');
  } else if (!results.functionTest.success) {
    console.log('❌ PROBLEMA: Função saveCompanySettings não está funcionando');
    console.log('💡 SOLUÇÃO: Verifique a implementação da função');
  } else {
    console.log('✅ TODOS OS TESTES PASSARAM!');
    console.log('💡 O problema pode estar na interface ou na aplicação das cores');
  }
  
  console.log('\n🔧 Para mais detalhes, execute: window.autoDiagnosis.runAutoDiagnosis()');
  
  return results;
}

// Executar diagnóstico
runAutoDiagnosis();

// Exportar funções
window.autoDiagnosis = {
  testSupabaseConnection,
  checkThemeColumns,
  testDirectSave,
  checkSavedData,
  testSaveCompanySettingsFunction,
  runAutoDiagnosis
};

console.log('\n🔧 Funções de diagnóstico disponíveis em window.autoDiagnosis');
