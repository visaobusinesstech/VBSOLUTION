const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'backend/env.supabase' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function createAIConfig() {
  console.log('🔧 Criando configuração de IA ativa...');
  
  const aiConfig = {
    name: 'Assistente Virtual VB',
    function: 'atendimento ao cliente',
    personality: 'Profissional, prestativo e eficiente',
    response_style: 'friendly',
    language: 'pt-BR',
    max_response_length: 500,
    api_key: 'sk-test-key-123',
    selected_model: 'gpt-3.5-turbo',
    is_connected: true,
    is_active: true,
    owner_id: '905b926a-785a-4f6d-9c3a-9455729500b3',
    is_company_wide: false,
    knowledge_base: {
      files: [],
      websites: [],
      qa: [
        {
          id: '1',
          question: 'Como funciona o serviço?',
          answer: 'Nosso serviço oferece soluções completas para seu negócio.'
        },
        {
          id: '2', 
          question: 'Quanto custa?',
          answer: 'Temos planos flexíveis que se adaptam ao seu orçamento.'
        }
      ]
    },
    integration: {
      api_key: 'sk-test-key-123',
      selected_model: 'gpt-3.5-turbo',
      is_connected: true
    }
  };
  
  const { data, error } = await supabase
    .from('ai_agent_configs')
    .upsert(aiConfig, { onConflict: 'owner_id,is_company_wide' })
    .select()
    .single();
    
  if (error) {
    console.error('❌ Erro ao criar configuração:', error);
  } else {
    console.log('✅ Configuração de IA criada com sucesso!');
    console.log('📋 ID:', data.id);
    console.log('📋 Nome:', data.name);
    console.log('📋 Ativa:', data.is_active);
    console.log('📋 API Key:', data.api_key ? 'Configurada' : 'Não configurada');
    console.log('📋 Knowledge Base Q&A:', data.knowledge_base?.qa?.length || 0, 'perguntas');
  }
}

createAIConfig();
