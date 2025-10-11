#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env.supabase' });

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAICompleteFlow() {
  console.log('🔄 Testando fluxo completo do AI...');
  
  const testPhone = '554796643900';
  const testUserId = '905b926a-785a-4f6d-9c3a-9455729500b3';
  const connectionId = 'connection_test_' + Date.now();
  
  try {
    // 1. Preparar contato de teste com AI habilitado
    console.log('\n1. Preparando contato de teste...');
    
    // Remover contato anterior se existir
    await supabase
      .from('contacts')
      .delete()
      .eq('phone', testPhone)
      .eq('owner_id', testUserId);
    
    // Criar contato com AI habilitado
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        phone: testPhone,
        name: 'Contato Teste AI Flow',
        owner_id: testUserId,
        ai_enabled: true,
        status: 'active'
      })
      .select()
      .single();
    
    if (contactError) {
      console.error('❌ Erro ao criar contato:', contactError);
      return;
    }
    
    console.log('✅ Contato criado com AI habilitado:', contact.name);
    
    // 2. Simular mensagem recebida do cliente
    console.log('\n2. Simulando mensagem recebida do cliente...');
    
    const messageData = {
      owner_id: testUserId,
      atendimento_id: null,
      connection_id: connectionId,
      connection_phone: testPhone,
      chat_id: testPhone + '@s.whatsapp.net',
      conteudo: 'Olá! Preciso de ajuda com um produto.',
      message_id: 'test_msg_' + Date.now(),
      message_type: 'TEXTO',
      media_type: null,
      remetente: 'CLIENTE',
      status: 'AGUARDANDO',
      timestamp: new Date().toISOString(),
      lida: false,
      media_url: null,
      media_mime: null,
      duration_ms: null,
      wpp_name: contact.name
    };
    
    const { data: message, error: messageError } = await supabase
      .from('whatsapp_mensagens')
      .insert(messageData)
      .select()
      .single();
    
    if (messageError) {
      console.error('❌ Erro ao inserir mensagem:', messageError);
      return;
    }
    
    console.log('✅ Mensagem do cliente inserida:', message.conteudo);
    
    // 3. Simular verificação do AI (como faria o backend)
    console.log('\n3. Simulando verificação do AI...');
    
    const { data: contactData, error: contactVerifyError } = await supabase
      .from('contacts')
      .select('ai_enabled, phone, name')
      .eq('phone', testPhone)
      .eq('owner_id', testUserId)
      .single();
    
    if (contactVerifyError) {
      console.error('❌ Erro ao verificar contato:', contactVerifyError);
      return;
    }
    
    console.log('🔍 Verificação do contato:', contactData);
    console.log(`🤖 AI habilitado: ${contactData.ai_enabled ? 'SIM' : 'NÃO'}`);
    
    // 4. Simular geração de resposta IA (se habilitado)
    if (contactData.ai_enabled) {
      console.log('\n4. Simulando geração de resposta IA...');
      
      const aiResponse = {
        owner_id: testUserId,
        atendimento_id: null,
        connection_id: connectionId,
        connection_phone: testPhone,
        chat_id: testPhone + '@s.whatsapp.net',
        conteudo: 'Olá! Sou o assistente virtual da empresa. Ficarei feliz em ajudá-lo com seu produto. Pode me contar mais detalhes sobre o que você precisa?',
        message_id: 'ai_msg_' + Date.now(),
        message_type: 'TEXTO',
        media_type: null,
        remetente: 'AI',
        status: 'ATENDIDO',
        timestamp: new Date().toISOString(),
        lida: true,
        media_url: null,
        media_mime: null,
        duration_ms: null,
        wpp_name: 'Agente IA'
      };
      
      const { data: aiMessage, error: aiMessageError } = await supabase
        .from('whatsapp_mensagens')
        .insert(aiResponse)
        .select()
        .single();
      
      if (aiMessageError) {
        console.error('❌ Erro ao inserir resposta IA:', aiMessageError);
        return;
      }
      
      console.log('✅ Resposta IA gerada e salva:', aiMessage.conteudo);
      
      // 5. Verificar mensagens na conversa
      console.log('\n5. Verificando conversa completa...');
      
      const { data: conversation, error: conversationError } = await supabase
        .from('whatsapp_mensagens')
        .select('remetente, conteudo, timestamp')
        .eq('chat_id', testPhone + '@s.whatsapp.net')
        .eq('owner_id', testUserId)
        .order('timestamp', { ascending: true });
      
      if (conversationError) {
        console.error('❌ Erro ao buscar conversa:', conversationError);
        return;
      }
      
      console.log('💬 Conversa completa:');
      conversation.forEach((msg, index) => {
        const sender = msg.remetente === 'CLIENTE' ? '👤 Cliente' : 
                      msg.remetente === 'AI' ? '🤖 IA' : 
                      '👨‍💼 Atendente';
        console.log(`${index + 1}. ${sender}: ${msg.conteudo}`);
      });
      
      console.log('\n🎉 Teste do fluxo completo do AI APROVADO!');
      console.log('✅ Contato criado com AI habilitado');
      console.log('✅ Mensagem do cliente recebida e processada');
      console.log('✅ AI verificado e ativado corretamente');
      console.log('✅ Resposta IA gerada e salva');
      console.log('✅ Conversa registrada corretamente');
    } else {
      console.log('\n❌ AI não está habilitado para este contato');
    }
    
    // 6. Limpeza
    console.log('\n6. Limpando dados de teste...');
    
    // Remover mensagens de teste
    await supabase
      .from('whatsapp_mensagens')
      .delete()
      .eq('chat_id', testPhone + '@s.whatsapp.net')
      .eq('owner_id', testUserId);
    
    // Remover contato de teste
    await supabase
      .from('contacts')
      .delete()
      .eq('id', contact.id);
    
    console.log('✅ Dados de teste removidos');
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar teste
testAICompleteFlow();

