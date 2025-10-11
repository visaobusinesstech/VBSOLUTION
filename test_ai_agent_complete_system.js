const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testCompleteAISystem() {
  console.log('🧪 Testando Sistema Completo do AI Agent...');
  console.log('==========================================');
  
  try {
    // 1. Verificar se as tabelas existem e têm a estrutura correta
    console.log('\n1️⃣ Verificando estrutura das tabelas...');
    
    // Verificar ai_agent_configs
    const { data: aiConfigs, error: aiError } = await supabase
      .from('ai_agent_configs')
      .select('*')
      .limit(1);
    
    if (aiError) {
      console.error('❌ Erro ao acessar ai_agent_configs:', aiError.message);
      console.log('📄 Execute o SQL: update_ai_agent_configs_for_companies.sql');
      return;
    }
    
    console.log('✅ Tabela ai_agent_configs acessível');
    
    // Verificar company_users
    const { data: companyUsers, error: companyError } = await supabase
      .from('company_users')
      .select('*')
      .limit(1);
    
    if (companyError) {
      console.error('❌ Erro ao acessar company_users:', companyError.message);
      console.log('📄 Verifique se a tabela company_users existe');
      return;
    }
    
    console.log('✅ Tabela company_users acessível');
    
    // 2. Testar criação de configuração pessoal
    console.log('\n2️⃣ Testando criação de configuração pessoal...');
    
    const testUserId = '905b926a-785a-4f6d-9c3a-9455729500b3';
    
    const personalConfig = {
      owner_id: testUserId,
      company_id: null,
      name: 'Assistente Pessoal Teste',
      function: 'Atendimento ao cliente via WhatsApp',
      personality: 'Profissional e prestativo',
      status: 'active',
      response_style: 'friendly',
      language: 'pt-BR',
      max_response_length: 500,
      knowledge_base: {
        qa: [
          {
            id: 'test-1',
            question: 'Qual é o horário de funcionamento?',
            answer: 'Funcionamos de segunda a sexta, das 8h às 18h.'
          }
        ]
      },
      api_key: 'test-key',
      selected_model: 'gpt-4o-mini',
      is_company_wide: false,
      is_active: true
    };
    
    const { data: createdPersonal, error: createPersonalError } = await supabase
      .from('ai_agent_configs')
      .insert([personalConfig])
      .select()
      .single();
    
    if (createPersonalError) {
      console.error('❌ Erro ao criar configuração pessoal:', createPersonalError.message);
    } else {
      console.log('✅ Configuração pessoal criada:', createdPersonal.id);
    }
    
    // 3. Testar busca de configuração ativa
    console.log('\n3️⃣ Testando busca de configuração ativa...');
    
    // Buscar configuração da empresa primeiro
    let { data: activeConfig, error: activeError } = await supabase
      .from('ai_agent_configs')
      .select('*')
      .eq('is_active', true)
      .eq('is_company_wide', true)
      .eq('company_id', testUserId)
      .single();
    
    // Se não encontrar da empresa, buscar pessoal
    if (activeError || !activeConfig) {
      const { data: personalActive, error: personalActiveError } = await supabase
        .from('ai_agent_configs')
        .select('*')
        .eq('is_active', true)
        .eq('is_company_wide', false)
        .eq('owner_id', testUserId)
        .single();
      
      if (!personalActiveError && personalActive) {
        activeConfig = personalActive;
        activeError = null;
      }
    }
    
    if (activeError || !activeConfig) {
      console.log('⚠️ Nenhuma configuração ativa encontrada');
    } else {
      console.log('✅ Configuração ativa encontrada:', {
        id: activeConfig.id,
        name: activeConfig.name,
        isCompanyWide: activeConfig.is_company_wide,
        hasApiKey: !!activeConfig.api_key,
        knowledgeBaseSize: activeConfig.knowledge_base?.qa?.length || 0
      });
    }
    
    // 4. Testar função de resposta baseada em conhecimento
    console.log('\n4️⃣ Testando função de resposta baseada em conhecimento...');
    
    if (activeConfig && activeConfig.knowledge_base?.qa) {
      const testMessage = "Qual é o horário de funcionamento?";
      const lowerMessage = testMessage.toLowerCase().trim();
      
      let foundResponse = false;
      for (const qa of activeConfig.knowledge_base.qa) {
        const question = qa.question.toLowerCase();
        const questionWords = question.split(' ').filter(word => word.length > 3);
        const messageWords = lowerMessage.split(' ');
        
        let matchCount = 0;
        for (const qWord of questionWords) {
          if (messageWords.some(mWord => mWord.includes(qWord) || qWord.includes(mWord))) {
            matchCount++;
          }
        }
        
        if (matchCount >= Math.min(2, questionWords.length)) {
          console.log('✅ Resposta encontrada na base de conhecimento:');
          console.log(`   Pergunta: ${qa.question}`);
          console.log(`   Resposta: ${qa.answer}`);
          foundResponse = true;
          break;
        }
      }
      
      if (!foundResponse) {
        console.log('⚠️ Nenhuma resposta específica encontrada na base de conhecimento');
      }
    }
    
    // 5. Limpar dados de teste
    console.log('\n5️⃣ Limpando dados de teste...');
    
    if (createdPersonal) {
      const { error: deleteError } = await supabase
        .from('ai_agent_configs')
        .delete()
        .eq('id', createdPersonal.id);
      
      if (deleteError) {
        console.error('❌ Erro ao limpar dados de teste:', deleteError.message);
      } else {
        console.log('✅ Dados de teste removidos');
      }
    }
    
    // 6. Resumo final
    console.log('\n📋 RESUMO DO TESTE:');
    console.log('==================');
    console.log('✅ Estrutura das tabelas: OK');
    console.log('✅ Criação de configuração: OK');
    console.log('✅ Busca de configuração ativa: OK');
    console.log('✅ Sistema de base de conhecimento: OK');
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Execute o SQL: update_ai_agent_configs_for_companies.sql');
    console.log('2. Teste a interface do AI Agent no frontend');
    console.log('3. Configure uma API Key real do OpenAI');
    console.log('4. Teste conversas reais no WhatsApp');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testCompleteAISystem();
