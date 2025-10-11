#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Simular exatamente o que o frontend faz
const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const userId = '905b926a-785a-4f6d-9c3a-9455729500b3';
const testPhoneNumber = '554796643900';

// Simular a função updateContact do frontend
async function updateContact(contactId, updates) {
  console.log('🔄 [updateContact] Iniciando atualização...');
  console.log('🔄 [updateContact] Contact ID:', contactId);
  console.log('🔄 [updateContact] Updates:', updates);

  try {
    const { data: updatedContact, error } = await supabase
      .from('contacts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contactId)
      .select()
      .single();

    if (error) {
      console.error('❌ [updateContact] Erro:', error);
      throw new Error(`Erro ao atualizar contato: ${error.message}`);
    }

    console.log('✅ [updateContact] Sucesso:', updatedContact);
    return updatedContact;
  } catch (err) {
    console.error('❌ [updateContact] Erro capturado:', err);
    throw err;
  }
}

// Simular a função toggleAiAgentMode do frontend
async function toggleAiAgentMode(newMode) {
  console.log('🤖 [toggleAiAgentMode] Alternando modo do agente IA para:', newMode);
  
  // Simular buscar contato (como o frontend faz)
  const { data: contactInfo, error: fetchError } = await supabase
    .from('contacts')
    .select('*')
    .eq('phone', testPhoneNumber)
    .eq('owner_id', userId)
    .single();

  if (fetchError) {
    console.error('❌ [toggleAiAgentMode] Erro ao buscar contato:', fetchError);
    return;
  }

  console.log('✅ [toggleAiAgentMode] Contato encontrado:', {
    id: contactInfo.id,
    name: contactInfo.name,
    phone: contactInfo.phone,
    ai_enabled: contactInfo.ai_enabled
  });

  if (contactInfo?.id) {
    try {
      console.log('🤖 [toggleAiAgentMode] Salvando estado do agente IA no banco de dados...');
      console.log('🤖 [toggleAiAgentMode] Contact ID:', contactInfo.id);
      console.log('🤖 [toggleAiAgentMode] New Mode:', newMode);
      console.log('🤖 [toggleAiAgentMode] AI Enabled:', newMode === 'ai');
      
      const result = await updateContact(contactInfo.id, { ai_enabled: newMode === 'ai' });
      console.log('🤖 [toggleAiAgentMode] Resultado da atualização:', result);
      console.log('🤖 [toggleAiAgentMode] Estado do agente IA salvo com sucesso!');
    } catch (error) {
      console.error('❌ [toggleAiAgentMode] Erro ao alterar modo do agente:', error);
    }
  } else {
    console.log('⚠️ [toggleAiAgentMode] Contato não encontrado, não é possível salvar estado do agente IA');
  }
}

async function debugFrontendAIActivation() {
  console.log('🧪 Debugando ativação do AI no frontend...');
  
  try {
    // Simular clicar no botão "Agente IA"
    console.log('\n🎯 Simulando clique no botão "Agente IA"...');
    await toggleAiAgentMode('ai');
    
    // Verificar se foi salvo
    console.log('\n🔍 Verificando se foi salvo...');
    const { data: verifyContact, error: verifyError } = await supabase
      .from('contacts')
      .select('*')
      .eq('phone', testPhoneNumber)
      .eq('owner_id', userId)
      .single();

    if (verifyError) {
      console.error('❌ Erro ao verificar:', verifyError);
      return;
    }

    console.log('✅ Estado final do contato:', {
      id: verifyContact.id,
      name: verifyContact.name,
      phone: verifyContact.phone,
      ai_enabled: verifyContact.ai_enabled
    });

    if (verifyContact.ai_enabled === true) {
      console.log('\n🎉 SUCESSO! O AI foi ativado corretamente!');
    } else {
      console.log('\n❌ FALHA! O AI não foi ativado.');
    }

  } catch (error) {
    console.error('❌ Erro geral no debug:', error);
  }
}

debugFrontendAIActivation();

