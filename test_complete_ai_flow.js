const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testCompleteAIFlow() {
  console.log('🧪 Testando fluxo completo do AI Agent...');
  console.log('=====================================');
  
  try {
    // 1. Verificar se a tabela ai_agent_configs existe e tem configurações
    console.log('\n1️⃣ Verificando configurações do AI Agent...');
    const { data: aiConfigs, error: configError } = await supabase
      .from('ai_agent_configs')
      .select('*');
    
    if (configError) {
      console.error('❌ Erro ao buscar configurações:', configError.message);
      console.log('📄 Execute o SQL no Supabase: disable_ai_rls_temporarily.sql');
      return;
    }
    
    if (aiConfigs.length === 0) {
      console.log('⚠️ Nenhuma configuração encontrada');
      console.log('📄 Execute o SQL no Supabase: disable_ai_rls_temporarily.sql');
      return;
    }
    
    const config = aiConfigs[0];
    console.log('✅ Configuração encontrada:');
    console.log(`   Nome: ${config.name}`);
    console.log(`   Função: ${config.function}`);
    console.log(`   Personalidade: ${config.personality}`);
    console.log(`   Tom: ${config.tone}`);
    console.log(`   API Key: ${config.api_key ? 'Configurada' : 'Não configurada'}`);
    console.log(`   Base de Conhecimento: ${config.knowledge_base?.qa?.length || 0} Q&A`);
    
    // 2. Verificar se a tabela whatsapp_sessions tem o campo attendance_type
    console.log('\n2️⃣ Verificando estrutura da tabela whatsapp_sessions...');
    const { data: sessions, error: sessionError } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .limit(1);
    
    if (sessionError) {
      console.error('❌ Erro ao verificar tabela whatsapp_sessions:', sessionError.message);
      console.log('📄 Execute o SQL no Supabase: add_attendance_type_column.sql');
      return;
    }
    
    console.log('✅ Tabela whatsapp_sessions acessível');
    if (sessions.length > 0) {
      const session = sessions[0];
      console.log(`   Campos disponíveis: ${Object.keys(session).join(', ')}`);
      if (session.attendance_type) {
        console.log(`   Tipo de atendimento: ${session.attendance_type}`);
      } else {
        console.log('⚠️ Campo attendance_type não encontrado');
        console.log('📄 Execute o SQL no Supabase: add_attendance_type_column.sql');
      }
    }
    
    // 3. Testar função de resposta do AI
    console.log('\n3️⃣ Testando função de resposta do AI...');
    
    // Simular mensagem do usuário
    const testMessage = "Olá, gostaria de saber mais sobre os serviços oferecidos";
    console.log(`   Mensagem de teste: "${testMessage}"`);
    
    // Simular função generateKnowledgeBasedResponse
    const lowerMessage = testMessage.toLowerCase().trim();
    let foundResponse = false;
    
    if (config.knowledge_base?.qa && config.knowledge_base.qa.length > 0) {
      for (const qa of config.knowledge_base.qa) {
        const question = qa.question.toLowerCase();
        
        // Verificar se a mensagem contém palavras-chave da pergunta
        const questionWords = question.split(' ').filter(word => word.length > 3);
        const messageWords = lowerMessage.split(' ');
        
        let matchCount = 0;
        for (const qWord of questionWords) {
          if (messageWords.some(mWord => mWord.includes(qWord) || qWord.includes(mWord))) {
            matchCount++;
          }
        }
        
        // Se encontrou uma correspondência significativa
        if (matchCount >= Math.min(2, questionWords.length)) {
          console.log('✅ Resposta encontrada na base de conhecimento:');
          console.log(`   Pergunta: ${qa.question}`);
          console.log(`   Resposta: ${qa.answer}`);
          foundResponse = true;
          break;
        }
      }
    }
    
    if (!foundResponse) {
      console.log('⚠️ Nenhuma resposta específica encontrada na base de conhecimento');
      console.log('   Usando resposta padrão baseada na personalidade');
    }
    
    // 4. Verificar se o backend está rodando
    console.log('\n4️⃣ Verificando se o backend está rodando...');
    try {
      const response = await fetch('http://localhost:3001/api/health');
      if (response.ok) {
        console.log('✅ Backend está rodando na porta 3001');
      } else {
        console.log('⚠️ Backend pode não estar rodando ou em porta diferente');
      }
    } catch (error) {
      console.log('⚠️ Backend não está acessível:', error.message);
      console.log('💡 Execute: cd backend && node simple-baileys-server.js');
    }
    
    // 5. Resumo e próximos passos
    console.log('\n📋 RESUMO E PRÓXIMOS PASSOS:');
    console.log('=====================================');
    
    if (aiConfigs.length > 0 && config.knowledge_base?.qa?.length > 0) {
      console.log('✅ AI Agent configurado com base de conhecimento');
    } else {
      console.log('⚠️ AI Agent precisa de configuração');
    }
    
    if (sessions.length > 0 && sessions[0].attendance_type) {
      console.log('✅ Campo attendance_type disponível');
    } else {
      console.log('⚠️ Execute: add_attendance_type_column.sql');
    }
    
    console.log('\n🎯 TESTE FINAL:');
    console.log('1. Execute os SQLs necessários no Supabase');
    console.log('2. Reinicie o backend se necessário');
    console.log('3. Teste uma conversa real no WhatsApp');
    console.log('4. Verifique se o AI responde com conhecimento treinado');
    console.log('5. Teste o modal de detalhes da conexão');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testCompleteAIFlow();

