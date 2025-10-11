// Script de debug para verificar por que as cores não estão sendo salvas
// Execute este script no console do navegador

console.log('🔍 Debug: Verificando por que as cores não estão sendo salvas...');

// Função para verificar se as colunas existem no banco
async function checkDatabaseColumns() {
  console.log('📊 Verificando colunas do banco de dados...');
  
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('sidebar_color, topbar_color, button_color')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao verificar colunas:', error);
      return false;
    }
    
    console.log('✅ Colunas encontradas no banco:', Object.keys(data[0] || {}));
    return true;
  } catch (err) {
    console.error('❌ Erro ao conectar com o banco:', err);
    return false;
  }
}

// Função para testar salvamento direto no banco
async function testDirectSave() {
  console.log('💾 Testando salvamento direto no banco...');
  
  const testColors = {
    sidebar_color: '#ff6b6b',
    topbar_color: '#4ecdc4',
    button_color: '#45b7d1'
  };
  
  try {
    // Buscar company_id do usuário atual
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.error('❌ Usuário não logado');
      return false;
    }
    
    const userId = user.user.id;
    console.log('👤 User ID:', userId);
    
    // Buscar company_id
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('id', userId)
      .single();
    
    const companyId = profile?.company_id || '11111111-1111-1111-1111-111111111111';
    console.log('🏢 Company ID:', companyId);
    
    // Tentar salvar diretamente
    const { data, error } = await supabase
      .from('company_settings')
      .upsert({
        company_id: companyId,
        company_name: 'Teste Empresa',
        ...testColors,
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.error('❌ Erro ao salvar:', error);
      return false;
    }
    
    console.log('✅ Salvamento direto bem-sucedido:', data);
    return true;
  } catch (err) {
    console.error('❌ Erro no teste de salvamento:', err);
    return false;
  }
}

// Função para verificar dados salvos
async function checkSavedData() {
  console.log('🔍 Verificando dados salvos...');
  
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('❌ Erro ao buscar dados:', error);
      return;
    }
    
    console.log('📋 Dados salvos no banco:');
    data.forEach((record, index) => {
      console.log(`${index + 1}. Company: ${record.company_name}`);
      console.log(`   Sidebar: ${record.sidebar_color}`);
      console.log(`   Topbar: ${record.topbar_color}`);
      console.log(`   Button: ${record.button_color}`);
      console.log(`   Updated: ${record.updated_at}`);
      console.log('---');
    });
  } catch (err) {
    console.error('❌ Erro ao verificar dados:', err);
  }
}

// Função para testar a função saveCompanySettings
async function testSaveCompanySettings() {
  console.log('🧪 Testando função saveCompanySettings...');
  
  try {
    // Simular dados de teste
    const testData = {
      company_name: 'Empresa Teste',
      sidebar_color: '#ff9999',
      topbar_color: '#99ff99',
      button_color: '#9999ff'
    };
    
    // Verificar se a função está disponível globalmente
    if (typeof window.testSaveCompanySettings === 'function') {
      const result = await window.testSaveCompanySettings(testData);
      console.log('✅ Resultado da função:', result);
      return result;
    } else {
      console.log('❌ Função saveCompanySettings não encontrada globalmente');
      return false;
    }
  } catch (err) {
    console.error('❌ Erro ao testar função:', err);
    return false;
  }
}

// Função para verificar logs de erro
function checkErrorLogs() {
  console.log('📝 Verificando logs de erro...');
  
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
  }, 3000);
}

// Função principal de debug
async function runThemeSaveDebug() {
  console.log('🚀 Iniciando debug do salvamento de cores...');
  
  // Teste 1: Verificar colunas do banco
  console.log('\n1️⃣ Verificando colunas do banco:');
  const columnsExist = await checkDatabaseColumns();
  
  // Teste 2: Verificar dados salvos
  console.log('\n2️⃣ Verificando dados salvos:');
  await checkSavedData();
  
  // Teste 3: Testar salvamento direto
  console.log('\n3️⃣ Testando salvamento direto:');
  const directSave = await testDirectSave();
  
  // Teste 4: Verificar logs de erro
  console.log('\n4️⃣ Verificando logs de erro:');
  checkErrorLogs();
  
  // Teste 5: Testar função saveCompanySettings
  console.log('\n5️⃣ Testando função saveCompanySettings:');
  await testSaveCompanySettings();
  
  console.log('\n✅ Debug concluído!');
  
  if (!columnsExist) {
    console.log('❌ PROBLEMA: Colunas não existem no banco. Execute o script fix_theme_columns_migration.sql');
  } else if (!directSave) {
    console.log('❌ PROBLEMA: Erro ao salvar diretamente no banco');
  } else {
    console.log('✅ Banco de dados funcionando. Problema pode estar na interface.');
  }
}

// Executar debug
runThemeSaveDebug();

// Exportar funções para uso manual
window.debugThemeSave = {
  checkDatabaseColumns,
  testDirectSave,
  checkSavedData,
  testSaveCompanySettings,
  runThemeSaveDebug
};

console.log('🔧 Funções de debug disponíveis em window.debugThemeSave');
