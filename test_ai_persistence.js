const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testAIPersistence() {
  console.log('🧪 Testando persistência das configurações do AI...');
  
  try {
    // 1. Verificar se a tabela existe
    console.log('1️⃣ Verificando se a tabela ai_agent_configs existe...');
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'ai_agent_configs');
    
    if (tableError) {
      console.error('❌ Erro ao verificar tabelas:', tableError);
      return;
    }
    
    if (tables.length === 0) {
      console.log('⚠️ Tabela ai_agent_configs não existe. Execute o SQL no Supabase primeiro.');
      console.log('📄 Execute o arquivo: create_ai_agent_configs_simple.sql');
      return;
    }
    
    console.log('✅ Tabela ai_agent_configs existe!');
    
    // 2. Verificar configurações existentes
    console.log('2️⃣ Verificando configurações existentes...');
    const { data: configs, error: configError } = await supabase
      .from('ai_agent_configs')
      .select('*');
    
    if (configError) {
      console.error('❌ Erro ao buscar configurações:', configError);
      return;
    }
    
    console.log('📊 Configurações encontradas:', configs.length);
    configs.forEach((config, index) => {
      console.log(`\n🤖 Configuração ${index + 1}:`);
      console.log(`   Nome: ${config.name}`);
      console.log(`   Função: ${config.function}`);
      console.log(`   Personalidade: ${config.personality}`);
      console.log(`   Status: ${config.status}`);
      console.log(`   Modelo: ${config.selected_model}`);
      console.log(`   API Key: ${config.api_key ? 'Configurada' : 'Não configurada'}`);
      console.log(`   Owner ID: ${config.owner_id}`);
    });
    
    // 3. Testar atualização de configuração
    console.log('\n3️⃣ Testando atualização de configuração...');
    const testConfig = {
      name: 'Assistente Virtual VB - Teste',
      personality: 'Muito amigável e prestativo',
      tone: 'Conversacional e descontraído',
      rules: 'Sempre usar emojis e ser muito simpático',
      company_context: 'Empresa de tecnologia inovadora',
      sector: 'Tecnologia',
      company_description: 'Especializada em soluções digitais avançadas'
    };
    
    const { data: updatedConfig, error: updateError } = await supabase
      .from('ai_agent_configs')
      .update(testConfig)
      .eq('owner_id', '905b926a-785a-4f6d-9c3a-9455729500b3')
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Erro ao atualizar configuração:', updateError);
    } else {
      console.log('✅ Configuração atualizada com sucesso!');
      console.log('📝 Nova personalidade:', updatedConfig.personality);
      console.log('📝 Novo tom:', updatedConfig.tone);
    }
    
    // 4. Testar busca de configuração ativa
    console.log('\n4️⃣ Testando busca de configuração ativa...');
    const { data: activeConfig, error: activeError } = await supabase
      .from('ai_agent_configs')
      .select('*')
      .eq('status', 'active')
      .single();
    
    if (activeError) {
      console.error('❌ Erro ao buscar configuração ativa:', activeError);
    } else {
      console.log('✅ Configuração ativa encontrada!');
      console.log('🤖 Nome:', activeConfig.name);
      console.log('🤖 Personalidade:', activeConfig.personality);
      console.log('🤖 Tom:', activeConfig.tone);
    }
    
    console.log('\n🎉 Teste de persistência concluído!');
    console.log('📋 Próximos passos:');
    console.log('1. Execute o SQL no Supabase: create_ai_agent_configs_simple.sql');
    console.log('2. Configure uma API key do OpenAI na tabela');
    console.log('3. Teste o AI no frontend');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testAIPersistence();

