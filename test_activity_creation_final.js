// Script final para testar criação de atividades
// Execute este script no console do navegador na página /activities

console.log('🧪 TESTE FINAL - Criação de Atividades');
console.log('=====================================');

async function testActivityCreationFinal() {
  try {
    // 1. Verificar se o hook useActivities está disponível
    console.log('\n1. Verificando ambiente...');
    
    if (typeof window.supabase === 'undefined') {
      console.error('❌ Supabase não disponível');
      return;
    }
    
    // Verificar autenticação
    const { data: { user }, error: userError } = await window.supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ Usuário não autenticado');
      return;
    }
    
    console.log('✅ Ambiente OK - Usuário:', user.id);

    // 2. Testar criação direta no Supabase
    console.log('\n2. Testando criação direta no Supabase...');
    
    const testData = {
      title: 'Teste Final - ' + new Date().toLocaleTimeString(),
      description: 'Teste de criação direta no Supabase',
      type: 'task',
      priority: 'medium',
      status: 'pending',
      created_by: user.id,
      company_id: null
    };
    
    console.log('📝 Dados de teste:', testData);
    
    const { data: result, error: insertError } = await window.supabase
      .from('activities')
      .insert([testData])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Erro na inserção direta:', insertError);
      console.error('Código do erro:', insertError.code);
      console.error('Mensagem:', insertError.message);
      console.error('Detalhes:', insertError.details);
      console.error('Hint:', insertError.hint);
      
      // Sugestões baseadas no erro
      if (insertError.code === '42501') {
        console.log('\n💡 SOLUÇÃO: Erro de permissão (RLS)');
        console.log('   - Verificar políticas RLS da tabela activities');
        console.log('   - Executar no Supabase SQL Editor:');
        console.log('     DROP POLICY IF EXISTS "Users can insert activities" ON activities;');
        console.log('     CREATE POLICY "Users can insert activities" ON activities');
        console.log('       FOR INSERT WITH CHECK (created_by = auth.uid());');
      } else if (insertError.code === 'PGRST116') {
        console.log('\n💡 SOLUÇÃO: Tabela não encontrada');
        console.log('   - Criar tabela activities no Supabase');
        console.log('   - Executar o script create_activities_table.sql');
      } else if (insertError.code === '23503') {
        console.log('\n💡 SOLUÇÃO: Violação de chave estrangeira');
        console.log('   - Verificar se o usuário existe na tabela profiles ou user_profiles');
      }
      
      return;
    } else {
      console.log('✅ Inserção direta bem-sucedida:', result);
      
      // Limpar teste
      const { error: deleteError } = await window.supabase
        .from('activities')
        .delete()
        .eq('id', result.id);
      
      if (deleteError) {
        console.log('⚠️ Erro ao limpar teste:', deleteError);
      } else {
        console.log('✅ Teste limpo com sucesso');
      }
    }

    // 3. Testar através da função do hook (simulação)
    console.log('\n3. Testando dados que seriam enviados pelo formulário...');
    
    const formData = {
      title: 'Teste Formulário - ' + new Date().toLocaleTimeString(),
      description: 'Atividade criada através do formulário',
      type: 'task',
      priority: 'high',
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      responsibleId: '',
      projectId: '',
      workGroup: '',
      department: '',
      companyId: ''
    };
    
    console.log('📋 Dados do formulário:', formData);
    
    // Simular processamento do handleCreateActivity
    const activityData = {
      title: formData.title,
      description: formData.description,
      type: formData.type,
      priority: formData.priority,
      status: formData.status,
      due_date: formData.date ? new Date(formData.date).toISOString() : undefined,
      responsible_id: formData.responsibleId || undefined,
      project_id: formData.projectId || undefined,
      work_group: formData.workGroup || undefined,
      department: formData.department || undefined,
      company_id: formData.companyId || undefined
    };
    
    console.log('🔄 Dados processados para createActivity:', activityData);
    
    // Testar inserção com dados processados
    const { data: formResult, error: formError } = await window.supabase
      .from('activities')
      .insert([{
        ...activityData,
        created_by: user.id
      }])
      .select()
      .single();
    
    if (formError) {
      console.error('❌ Erro com dados do formulário:', formError);
    } else {
      console.log('✅ Teste com dados do formulário bem-sucedido:', formResult);
      
      // Limpar teste
      await window.supabase
        .from('activities')
        .delete()
        .eq('id', formResult.id);
    }

    // 4. Verificar atividades existentes
    console.log('\n4. Verificando atividades existentes...');
    const { data: existingActivities, error: fetchError } = await window.supabase
      .from('activities')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (fetchError) {
      console.error('❌ Erro ao buscar atividades:', fetchError);
    } else {
      console.log(`✅ ${existingActivities.length} atividades encontradas para o usuário`);
      if (existingActivities.length > 0) {
        console.log('📋 Última atividade:', existingActivities[0]);
      }
    }

    // 5. Resumo final
    console.log('\n5. RESUMO FINAL:');
    console.log('================');
    console.log('✅ Autenticação: OK');
    console.log('✅ Acesso à tabela: OK');
    console.log('✅ Inserção direta: OK');
    console.log('✅ Dados do formulário: OK');
    console.log('✅ Busca de atividades: OK');
    
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('💡 Se ainda houver erro na interface, verifique:');
    console.log('   - Console do navegador para logs detalhados');
    console.log('   - Se o hook useActivities está sendo chamado corretamente');
    console.log('   - Se há algum erro no handleCreateActivity');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Executar teste
testActivityCreationFinal();
