// Script para executar diagnóstico de tema automaticamente
// Este script será executado para diagnosticar o problema

console.log('🔍 EXECUTANDO DIAGNÓSTICO DE TEMA AUTOMATICAMENTE...');
console.log('='.repeat(60));

// Função para testar salvamento de tema
async function executeThemeDiagnosis() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: {},
    errors: [],
    success: false
  };

  try {
    // Teste 1: Verificar se Supabase está disponível
    console.log('\n1️⃣ TESTANDO CONEXÃO COM SUPABASE...');
    
    if (typeof supabase === 'undefined') {
      results.errors.push('Supabase não está disponível');
      console.error('❌ Supabase não está disponível');
      return results;
    }
    
    results.tests.supabase = true;
    console.log('✅ Supabase disponível');

    // Teste 2: Verificar usuário logado
    console.log('\n2️⃣ VERIFICANDO USUÁRIO LOGADO...');
    
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user.user) {
      results.errors.push('Usuário não logado: ' + (userError?.message || 'Nenhum usuário'));
      console.error('❌ Usuário não logado:', userError);
      return results;
    }
    
    results.tests.user = true;
    console.log('✅ Usuário logado:', user.user.id);

    // Teste 3: Verificar colunas de tema
    console.log('\n3️⃣ VERIFICANDO COLUNAS DE TEMA...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('company_settings')
      .select('sidebar_color, topbar_color, button_color')
      .limit(1);
    
    if (columnsError) {
      results.errors.push('Erro ao verificar colunas: ' + columnsError.message);
      console.error('❌ Erro ao verificar colunas:', columnsError);
      return results;
    }
    
    results.tests.columns = true;
    console.log('✅ Colunas de tema existem');

    // Teste 4: Buscar company_id
    console.log('\n4️⃣ BUSCANDO COMPANY_ID...');
    
    let companyId = null;
    
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('id', user.user.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.log('⚠️ Erro ao buscar perfil:', profileError.message);
    } else {
      companyId = userProfile?.company_id;
    }
    
    if (!companyId) {
      const { data: companyUser, error: companyUserError } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('id', user.user.id)
        .single();
      
      if (!companyUserError && companyUser?.company_id) {
        companyId = companyUser.company_id;
      }
    }
    
    if (!companyId) {
      companyId = '11111111-1111-1111-1111-111111111111';
      console.log('⚠️ Usando company_id padrão:', companyId);
    }
    
    results.tests.companyId = true;
    console.log('✅ Company ID:', companyId);

    // Teste 5: Testar salvamento
    console.log('\n5️⃣ TESTANDO SALVAMENTO...');
    
    const testData = {
      company_id: companyId,
      company_name: 'Teste Diagnóstico Automático',
      sidebar_color: '#ff6b6b',
      topbar_color: '#4ecdc4',
      button_color: '#45b7d1',
      updated_at: new Date().toISOString()
    };
    
    console.log('📝 Dados de teste:', testData);
    
    const { data: saveResult, error: saveError } = await supabase
      .from('company_settings')
      .upsert(testData)
      .select();
    
    if (saveError) {
      results.errors.push('Erro ao salvar: ' + saveError.message);
      console.error('❌ Erro ao salvar:', saveError);
      console.error('Código do erro:', saveError.code);
      console.error('Detalhes:', saveError.details);
      return results;
    }
    
    results.tests.save = true;
    console.log('✅ Salvamento bem-sucedido');
    console.log('Dados salvos:', saveResult[0]);

    // Teste 6: Verificar dados salvos
    console.log('\n6️⃣ VERIFICANDO DADOS SALVOS...');
    
    const { data: savedData, error: fetchError } = await supabase
      .from('company_settings')
      .select('*')
      .eq('company_id', companyId)
      .single();
    
    if (fetchError) {
      results.errors.push('Erro ao verificar dados salvos: ' + fetchError.message);
      console.error('❌ Erro ao verificar dados salvos:', fetchError);
      return results;
    }
    
    results.tests.verify = true;
    console.log('✅ Dados verificados no banco');
    console.log('Sidebar:', savedData.sidebar_color);
    console.log('Topbar:', savedData.topbar_color);
    console.log('Button:', savedData.button_color);

    // Teste 7: Aplicar cores no CSS
    console.log('\n7️⃣ APLICANDO CORES NO CSS...');
    
    document.documentElement.style.setProperty('--sidebar-color', savedData.sidebar_color);
    document.documentElement.style.setProperty('--topbar-color', savedData.topbar_color);
    document.documentElement.style.setProperty('--button-color', savedData.button_color);
    
    results.tests.css = true;
    console.log('✅ Cores aplicadas no CSS');

    // Resultado final
    results.success = true;
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ O sistema de salvamento de tema está funcionando');
    
    return results;

  } catch (error) {
    results.errors.push('Erro geral: ' + error.message);
    console.error('❌ ERRO GERAL:', error);
    return results;
  }
}

// Executar diagnóstico
executeThemeDiagnosis().then(results => {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTADO FINAL DO DIAGNÓSTICO:');
  console.log('='.repeat(60));
  console.log('Timestamp:', results.timestamp);
  console.log('Sucesso:', results.success);
  console.log('Testes passaram:', Object.keys(results.tests).length);
  console.log('Erros encontrados:', results.errors.length);
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERROS ENCONTRADOS:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  if (results.success) {
    console.log('\n✅ DIAGNÓSTICO CONCLUÍDO COM SUCESSO!');
    console.log('💡 O problema pode estar na interface, não no banco de dados');
  } else {
    console.log('\n❌ DIAGNÓSTICO FALHOU');
    console.log('💡 Verifique os erros acima para identificar o problema');
  }
  
  // Salvar resultados para análise
  window.diagnosisResults = results;
  console.log('\n🔧 Resultados salvos em: window.diagnosisResults');
});

// Exportar função
window.executeThemeDiagnosis = executeThemeDiagnosis;
