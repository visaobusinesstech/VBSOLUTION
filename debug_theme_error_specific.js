// Script específico para debugar o erro "Falha ao aplicar tema"
// Execute este script no console do navegador

console.log('🔍 Debug específico: Erro "Falha ao aplicar tema"');

// Função para testar se o Supabase está funcionando
async function testSupabaseConnection() {
  console.log('📡 Testando conexão com Supabase...');
  
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro de conexão com Supabase:', error);
      return false;
    }
    
    console.log('✅ Conexão com Supabase funcionando');
    return true;
  } catch (err) {
    console.error('❌ Erro ao conectar com Supabase:', err);
    return false;
  }
}

// Função para verificar se as colunas existem
async function checkThemeColumns() {
  console.log('🔍 Verificando colunas de tema...');
  
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('sidebar_color, topbar_color, button_color')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao verificar colunas:', error);
      console.error('Detalhes do erro:', error.message);
      console.error('Código do erro:', error.code);
      console.error('Detalhes adicionais:', error.details);
      return false;
    }
    
    console.log('✅ Colunas de tema existem no banco');
    console.log('Colunas encontradas:', Object.keys(data[0] || {}));
    return true;
  } catch (err) {
    console.error('❌ Erro ao verificar colunas:', err);
    return false;
  }
}

// Função para testar salvamento com dados mínimos
async function testMinimalSave() {
  console.log('💾 Testando salvamento com dados mínimos...');
  
  try {
    // Buscar usuário atual
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.error('❌ Usuário não logado');
      return false;
    }
    
    const userId = user.user.id;
    console.log('👤 User ID:', userId);
    
    // Dados mínimos para teste
    const testData = {
      company_id: '11111111-1111-1111-1111-111111111111',
      company_name: 'Teste Empresa',
      sidebar_color: '#ff0000',
      topbar_color: '#00ff00',
      button_color: '#0000ff'
    };
    
    console.log('📝 Dados de teste:', testData);
    
    // Tentar inserir
    const { data, error } = await supabase
      .from('company_settings')
      .upsert(testData)
      .select();
    
    if (error) {
      console.error('❌ Erro ao salvar dados mínimos:', error);
      console.error('Detalhes do erro:', error.message);
      console.error('Código do erro:', error.code);
      console.error('Detalhes adicionais:', error.details);
      console.error('Hint:', error.hint);
      return false;
    }
    
    console.log('✅ Salvamento com dados mínimos funcionou');
    console.log('Dados salvos:', data);
    return true;
  } catch (err) {
    console.error('❌ Erro no teste de salvamento:', err);
    return false;
  }
}

// Função para simular exatamente o que a interface faz
async function testInterfaceSave() {
  console.log('🎨 Testando salvamento como a interface faz...');
  
  try {
    // Buscar usuário atual
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.error('❌ Usuário não logado');
      return false;
    }
    
    const userId = user.user.id;
    
    // Buscar company_id como a interface faz
    let companyId = null;
    
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('id', userId)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar perfil:', profileError);
    }
    
    companyId = userProfile?.company_id;
    console.log('🏢 Company ID do perfil:', companyId);
    
    if (!companyId) {
      const { data: companyUser, error: companyUserError } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('id', userId)
        .single();
      
      if (!companyUserError && companyUser?.company_id) {
        companyId = companyUser.company_id;
      }
    }
    
    if (!companyId) {
      companyId = '11111111-1111-1111-1111-111111111111';
      console.log('🏢 Usando company_id padrão:', companyId);
    }
    
    // Dados como a interface envia
    const themeColors = {
      sidebar_color: '#ff6b6b',
      topbar_color: '#4ecdc4',
      button_color: '#45b7d1'
    };
    
    const settingsToSave = {
      company_name: 'Empresa Teste Interface',
      ...themeColors,
      company_id: companyId,
      updated_at: new Date().toISOString()
    };
    
    console.log('📝 Dados preparados para salvar:', settingsToSave);
    
    // Verificar se já existe
    const { data: existingSettings } = await supabase
      .from('company_settings')
      .select('id')
      .eq('company_id', companyId)
      .single();
    
    console.log('🔍 Configuração existente:', existingSettings);
    
    let result;
    if (existingSettings) {
      console.log('🔄 Atualizando configuração existente...');
      result = await supabase
        .from('company_settings')
        .update(settingsToSave)
        .eq('id', existingSettings.id)
        .select()
        .single();
    } else {
      console.log('➕ Criando nova configuração...');
      result = await supabase
        .from('company_settings')
        .insert([settingsToSave])
        .select()
        .single();
    }
    
    console.log('📊 Resultado da operação:', result);
    
    if (result.error) {
      console.error('❌ Erro na operação:', result.error);
      console.error('Detalhes do erro:', result.error.message);
      console.error('Código do erro:', result.error.code);
      console.error('Detalhes adicionais:', result.error.details);
      console.error('Hint:', result.error.hint);
      return false;
    }
    
    console.log('✅ Salvamento da interface funcionou');
    console.log('Dados salvos:', result.data);
    return true;
  } catch (err) {
    console.error('❌ Erro no teste da interface:', err);
    return false;
  }
}

// Função para verificar permissões RLS
async function checkRLSPermissions() {
  console.log('🔐 Verificando permissões RLS...');
  
  try {
    // Tentar ler dados
    const { data: readData, error: readError } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1);
    
    if (readError) {
      console.error('❌ Erro de leitura (RLS):', readError);
      return false;
    }
    
    console.log('✅ Permissão de leitura OK');
    
    // Tentar inserir dados de teste
    const testData = {
      company_id: '11111111-1111-1111-1111-111111111111',
      company_name: 'Teste RLS',
      sidebar_color: '#test',
      topbar_color: '#test',
      button_color: '#test'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('company_settings')
      .insert([testData])
      .select();
    
    if (insertError) {
      console.error('❌ Erro de inserção (RLS):', insertError);
      return false;
    }
    
    console.log('✅ Permissão de inserção OK');
    
    // Limpar dados de teste
    if (insertData && insertData[0]) {
      await supabase
        .from('company_settings')
        .delete()
        .eq('id', insertData[0].id);
    }
    
    return true;
  } catch (err) {
    console.error('❌ Erro ao verificar permissões:', err);
    return false;
  }
}

// Função principal de debug
async function runSpecificDebug() {
  console.log('🚀 Iniciando debug específico do erro...');
  
  // Teste 1: Conexão com Supabase
  console.log('\n1️⃣ Testando conexão com Supabase:');
  const connectionOK = await testSupabaseConnection();
  
  // Teste 2: Verificar colunas
  console.log('\n2️⃣ Verificando colunas de tema:');
  const columnsOK = await checkThemeColumns();
  
  // Teste 3: Verificar permissões RLS
  console.log('\n3️⃣ Verificando permissões RLS:');
  const permissionsOK = await checkRLSPermissions();
  
  // Teste 4: Salvamento mínimo
  console.log('\n4️⃣ Testando salvamento mínimo:');
  const minimalOK = await testMinimalSave();
  
  // Teste 5: Salvamento como interface
  console.log('\n5️⃣ Testando salvamento como interface:');
  const interfaceOK = await testInterfaceSave();
  
  console.log('\n📊 RESUMO DOS TESTES:');
  console.log('Conexão Supabase:', connectionOK ? '✅' : '❌');
  console.log('Colunas de tema:', columnsOK ? '✅' : '❌');
  console.log('Permissões RLS:', permissionsOK ? '✅' : '❌');
  console.log('Salvamento mínimo:', minimalOK ? '✅' : '❌');
  console.log('Salvamento interface:', interfaceOK ? '✅' : '❌');
  
  if (!connectionOK) {
    console.log('❌ PROBLEMA: Não consegue conectar com Supabase');
  } else if (!columnsOK) {
    console.log('❌ PROBLEMA: Colunas de tema não existem. Execute fix_theme_columns_migration.sql');
  } else if (!permissionsOK) {
    console.log('❌ PROBLEMA: Permissões RLS bloqueando operações');
  } else if (!minimalOK) {
    console.log('❌ PROBLEMA: Erro no salvamento básico');
  } else if (!interfaceOK) {
    console.log('❌ PROBLEMA: Erro no salvamento da interface');
  } else {
    console.log('✅ Todos os testes passaram. O problema pode estar na interface.');
  }
}

// Executar debug
runSpecificDebug();

// Exportar funções
window.debugThemeError = {
  testSupabaseConnection,
  checkThemeColumns,
  testMinimalSave,
  testInterfaceSave,
  checkRLSPermissions,
  runSpecificDebug
};

console.log('🔧 Funções de debug disponíveis em window.debugThemeError');
