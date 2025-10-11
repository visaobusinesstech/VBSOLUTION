// Script para testar a criação de atividades após correção
// Execute este script no console do navegador na página de atividades

console.log('🔧 Testando criação de atividades após correção...');

// Função para testar a criação de atividade
async function testActivityCreation() {
  try {
    console.log('➕ Testando criação de atividade...');
    
    if (typeof window !== 'undefined' && window.supabase) {
      // Verificar usuário autenticado
      const { data: { user }, error: userError } = await window.supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('❌ Usuário não autenticado:', userError);
        return false;
      }
      
      console.log('✅ Usuário autenticado:', user.id);
      
      // Verificar se o usuário existe na tabela profiles
      const { data: profile, error: profileError } = await window.supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.log('⚠️ Usuário não encontrado na tabela profiles:', profileError);
        console.log('💡 Isso pode ser normal se o usuário ainda não foi criado na tabela profiles');
      } else {
        console.log('✅ Perfil encontrado:', profile.id);
      }
      
      // Criar atividade de teste
      const testActivity = {
        title: `Teste de Criação - ${new Date().toLocaleString()}`,
        description: 'Esta é uma atividade de teste para verificar a criação',
        type: 'task',
        priority: 'medium',
        status: 'todo',
        owner_id: user.id
      };
      
      console.log('📝 Criando atividade:', testActivity);
      
      const { data, error } = await window.supabase
        .from('activities')
        .insert([testActivity])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Erro ao criar atividade:', error);
        console.log('🔍 Detalhes do erro:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return false;
      }
      
      console.log('✅ Atividade criada com sucesso:', data);
      
      // Verificar se a atividade aparece na lista
      setTimeout(async () => {
        const { data: activities, error: fetchError } = await window.supabase
          .from('activities')
          .select('*')
          .eq('id', data.id)
          .single();
        
        if (fetchError) {
          console.error('❌ Erro ao buscar atividade criada:', fetchError);
        } else {
          console.log('✅ Atividade encontrada após criação:', activities);
        }
      }, 1000);
      
      return true;
    } else {
      console.error('❌ Supabase não está disponível');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao testar criação:', error);
    return false;
  }
}

// Função para verificar a estrutura da tabela activities
async function checkActivitiesTableStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela activities...');
    
    if (typeof window !== 'undefined' && window.supabase) {
      // Buscar informações da tabela
      const { data, error } = await window.supabase
        .from('activities')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('❌ Erro ao verificar tabela:', error);
        return false;
      }
      
      if (data && data.length > 0) {
        const activity = data[0];
        console.log('📊 Estrutura da primeira atividade:', {
          id: activity.id,
          title: activity.title,
          owner_id: activity.owner_id,
          status: activity.status,
          created_at: activity.created_at
        });
        
        // Verificar se owner_id está presente
        if (activity.owner_id) {
          console.log('✅ Campo owner_id presente');
        } else {
          console.log('⚠️ Campo owner_id ausente');
        }
      } else {
        console.log('📋 Tabela vazia - nenhuma atividade encontrada');
      }
      
      return true;
    } else {
      console.error('❌ Supabase não está disponível');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar estrutura:', error);
    return false;
  }
}

// Função para verificar constraints da tabela
async function checkTableConstraints() {
  try {
    console.log('🔒 Verificando constraints da tabela...');
    
    if (typeof window !== 'undefined' && window.supabase) {
      // Tentar inserir uma atividade com owner_id inválido para testar constraints
      const { data, error } = await window.supabase
        .from('activities')
        .insert([{
          title: 'Teste de Constraint',
          description: 'Teste',
          owner_id: '00000000-0000-0000-0000-000000000000', // UUID inválido
          status: 'todo'
        }])
        .select();
      
      if (error) {
        console.log('✅ Constraint funcionando (erro esperado):', error.message);
        return true;
      } else {
        console.log('⚠️ Constraint pode não estar funcionando - atividade criada com UUID inválido');
        return false;
      }
    } else {
      console.error('❌ Supabase não está disponível');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar constraints:', error);
    return false;
  }
}

// Função para testar diferentes cenários de criação
async function testCreationScenarios() {
  try {
    console.log('🧪 Testando diferentes cenários de criação...');
    
    if (typeof window !== 'undefined' && window.supabase) {
      const { data: { user } } = await window.supabase.auth.getUser();
      
      if (!user) {
        console.log('⚠️ Usuário não autenticado - pulando testes');
        return false;
      }
      
      const scenarios = [
        {
          name: 'Atividade mínima',
          data: {
            title: 'Teste Mínimo',
            owner_id: user.id,
            status: 'todo'
          }
        },
        {
          name: 'Atividade completa',
          data: {
            title: 'Teste Completo',
            description: 'Descrição completa',
            type: 'task',
            priority: 'high',
            status: 'doing',
            owner_id: user.id
          }
        }
      ];
      
      for (const scenario of scenarios) {
        console.log(`📝 Testando: ${scenario.name}`);
        
        const { data, error } = await window.supabase
          .from('activities')
          .insert([scenario.data])
          .select()
          .single();
        
        if (error) {
          console.error(`❌ Erro no cenário "${scenario.name}":`, error.message);
        } else {
          console.log(`✅ Sucesso no cenário "${scenario.name}":`, data.id);
          
          // Limpar atividade de teste
          await window.supabase
            .from('activities')
            .delete()
            .eq('id', data.id);
        }
      }
      
      return true;
    } else {
      console.error('❌ Supabase não está disponível');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao testar cenários:', error);
    return false;
  }
}

// Função principal para executar todos os testes
async function runCreationTests() {
  console.log('🚀 Iniciando testes de criação de atividades...');
  
  const results = {
    structure: await checkActivitiesTableStructure(),
    constraints: await checkTableConstraints(),
    creation: await testActivityCreation(),
    scenarios: await testCreationScenarios()
  };
  
  console.log('📊 Resultados dos testes:', results);
  
  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed) {
    console.log('✅ Todos os testes passaram! A criação de atividades está funcionando.');
  } else {
    console.log('⚠️ Alguns testes falharam. Verifique os problemas acima.');
    
    if (!results.structure) {
      console.log('💡 Problema de estrutura: Execute o script fix_activities_foreign_key.sql');
    }
    if (!results.constraints) {
      console.log('💡 Problema de constraints: Verifique as políticas RLS');
    }
    if (!results.creation) {
      console.log('💡 Problema de criação: Verifique o owner_id e autenticação');
    }
    if (!results.scenarios) {
      console.log('💡 Problema de cenários: Verifique a validação de dados');
    }
  }
  
  return results;
}

// Executar testes automaticamente
runCreationTests();

// Exportar funções para uso manual
window.testCreation = {
  testActivityCreation,
  checkActivitiesTableStructure,
  checkTableConstraints,
  testCreationScenarios,
  runCreationTests
};

console.log('💡 Funções de teste disponíveis em window.testCreation');
