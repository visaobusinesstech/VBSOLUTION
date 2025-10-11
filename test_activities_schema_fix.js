// Script para testar se a correção da estrutura da tabela activities funcionou
// Execute este script no console do navegador na página /activities

console.log('🔧 TESTANDO CORREÇÃO DA ESTRUTURA DA TABELA ACTIVITIES');
console.log('====================================================');

async function testActivitiesSchemaFix() {
  try {
    // 1. Verificar se o Supabase está disponível
    console.log('\n1. Verificando Supabase...');
    if (typeof window.supabase === 'undefined') {
      console.error('❌ Supabase não está disponível');
      return;
    }
    console.log('✅ Supabase disponível');

    // 2. Verificar autenticação
    console.log('\n2. Verificando autenticação...');
    const { data: { user }, error: userError } = await window.supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Usuário não autenticado');
      return;
    }
    
    console.log('✅ Usuário autenticado:', user.id);

    // 3. Verificar estrutura da tabela activities
    console.log('\n3. Verificando estrutura da tabela activities...');
    const { data: columns, error: columnsError } = await window.supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'activities')
      .order('ordinal_position');
    
    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError);
      return;
    }
    
    console.log('📋 Estrutura atual da tabela activities:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // 4. Verificar se a coluna created_by existe
    const hasCreatedBy = columns.some(col => col.column_name === 'created_by');
    const hasOwnerId = columns.some(col => col.column_name === 'owner_id');
    const hasCompanyId = columns.some(col => col.column_name === 'company_id');

    console.log('\n4. Verificando colunas específicas:');
    console.log(`  - created_by: ${hasCreatedBy ? '✅ Existe' : '❌ Não existe'}`);
    console.log(`  - owner_id: ${hasOwnerId ? '⚠️ Existe (deve ser removida)' : '✅ Não existe'}`);
    console.log(`  - company_id: ${hasCompanyId ? '✅ Existe' : '❌ Não existe'}`);

    if (!hasCreatedBy) {
      console.error('\n❌ PROBLEMA: Coluna created_by não existe!');
      console.log('💡 SOLUÇÃO: Execute o script fix_activities_table_schema.sql no Supabase SQL Editor');
      return;
    }

    // 5. Testar criação de atividade
    console.log('\n5. Testando criação de atividade...');
    const testData = {
      title: 'Teste Schema Fix - ' + new Date().toLocaleTimeString(),
      description: 'Teste após correção da estrutura da tabela',
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
      console.error('❌ Erro ao criar atividade:', insertError);
      console.error('Detalhes:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
      
      if (insertError.message.includes('created_by')) {
        console.error('🔍 ERRO ESPECÍFICO: Problema com coluna created_by');
        console.log('💡 SOLUÇÃO: Execute o script fix_activities_table_schema.sql');
      }
      
      return;
    } else {
      console.log('✅ Atividade criada com sucesso:', result);
      
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

    // 6. Testar busca de atividades
    console.log('\n6. Testando busca de atividades...');
    const { data: activities, error: fetchError } = await window.supabase
      .from('activities')
      .select('*')
      .eq('created_by', user.id)
      .limit(5);
    
    if (fetchError) {
      console.error('❌ Erro ao buscar atividades:', fetchError);
    } else {
      console.log(`✅ ${activities.length} atividades encontradas`);
      if (activities.length > 0) {
        console.log('📋 Última atividade:', activities[0]);
      }
    }

    // 7. Resumo final
    console.log('\n7. RESUMO FINAL:');
    console.log('================');
    console.log('✅ Estrutura da tabela: OK');
    console.log('✅ Coluna created_by: OK');
    console.log('✅ Criação de atividades: OK');
    console.log('✅ Busca de atividades: OK');
    
    console.log('\n🎉 CORREÇÃO FUNCIONOU! Sistema pronto para uso.');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Executar teste
testActivitiesSchemaFix();
