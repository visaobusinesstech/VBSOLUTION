// Script direto para testar o salvamento de tema
// Execute este script no console do navegador

console.log('🔍 TESTE DIRETO: Salvamento de Tema');
console.log('='.repeat(50));

// Função para testar salvamento com dados exatos da interface
async function testThemeSaveNow() {
  console.log('🎨 Testando salvamento de tema...');
  
  try {
    // 1. Verificar se Supabase está disponível
    if (typeof supabase === 'undefined') {
      console.error('❌ Supabase não está disponível');
      return;
    }
    
    console.log('✅ Supabase disponível');
    
    // 2. Buscar usuário atual
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.error('❌ Usuário não logado');
      return;
    }
    
    console.log('✅ Usuário logado:', user.user.id);
    
    // 3. Buscar company_id
    let companyId = null;
    
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('id', user.user.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar perfil:', profileError);
    } else {
      companyId = userProfile?.company_id;
      console.log('✅ Company ID do perfil:', companyId);
    }
    
    if (!companyId) {
      const { data: companyUser, error: companyUserError } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('id', user.user.id)
        .single();
      
      if (!companyUserError && companyUser?.company_id) {
        companyId = companyUser.company_id;
        console.log('✅ Company ID do company_users:', companyId);
      }
    }
    
    if (!companyId) {
      companyId = '11111111-1111-1111-1111-111111111111';
      console.log('⚠️ Usando company_id padrão:', companyId);
    }
    
    // 4. Dados de teste (exatamente como a interface envia)
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
    
    console.log('📝 Dados preparados para salvar:');
    console.log(JSON.stringify(settingsToSave, null, 2));
    
    // 5. Verificar se já existe configuração
    const { data: existingSettings, error: checkError } = await supabase
      .from('company_settings')
      .select('id')
      .eq('company_id', companyId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar configuração existente:', checkError);
      return;
    }
    
    console.log('✅ Configuração existente:', existingSettings);
    
    // 6. Salvar/atualizar configuração
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
    
    console.log('📊 Resultado da operação:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.error) {
      console.error('❌ ERRO NA OPERAÇÃO:');
      console.error('Mensagem:', result.error.message);
      console.error('Código:', result.error.code);
      console.error('Detalhes:', result.error.details);
      console.error('Hint:', result.error.hint);
      return;
    }
    
    console.log('✅ SUCESSO! Configuração salva:');
    console.log(JSON.stringify(result.data, null, 2));
    
    // 7. Verificar se os dados foram salvos
    const { data: savedData, error: fetchError } = await supabase
      .from('company_settings')
      .select('*')
      .eq('company_id', companyId)
      .single();
    
    if (fetchError) {
      console.error('❌ Erro ao verificar dados salvos:', fetchError);
      return;
    }
    
    console.log('✅ Dados confirmados no banco:');
    console.log('Sidebar:', savedData.sidebar_color);
    console.log('Topbar:', savedData.topbar_color);
    console.log('Button:', savedData.button_color);
    
    // 8. Aplicar cores no CSS
    document.documentElement.style.setProperty('--sidebar-color', savedData.sidebar_color);
    document.documentElement.style.setProperty('--topbar-color', savedData.topbar_color);
    document.documentElement.style.setProperty('--button-color', savedData.button_color);
    
    console.log('✅ Cores aplicadas no CSS');
    
    return {
      success: true,
      data: savedData
    };
    
  } catch (error) {
    console.error('❌ ERRO GERAL:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Executar teste
testThemeSaveNow();

// Exportar função
window.testThemeSaveNow = testThemeSaveNow;

console.log('\n🔧 Função disponível: window.testThemeSaveNow()');
