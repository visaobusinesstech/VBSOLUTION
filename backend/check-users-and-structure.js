#!/usr/bin/env node

/**
 * Script para verificar usuários existentes e estrutura da tabela
 */

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Verificando usuários e estrutura da tabela...\n');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUsersAndStructure() {
  try {
    // 1. Verificar usuários existentes
    console.log('1️⃣ Verificando usuários existentes...');
    
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, name')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Erro ao consultar usuários:', usersError);
    } else {
      console.log(`✅ Encontrados ${users.length} usuários:`);
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name || 'Sem nome'} (${user.email}) - ID: ${user.id}`);
      });
    }
    
    // 2. Verificar estrutura da tabela ai_agent_configs
    console.log('\n2️⃣ Verificando estrutura da tabela ai_agent_configs...');
    
    const { data: agents, error: agentsError } = await supabase
      .from('ai_agent_configs')
      .select('*')
      .limit(1);
    
    if (agentsError) {
      console.error('❌ Erro ao consultar agentes:', agentsError);
    } else if (agents.length > 0) {
      console.log('✅ Estrutura da tabela ai_agent_configs:');
      const record = agents[0];
      const columns = Object.keys(record);
      
      columns.forEach(column => {
        const value = record[column];
        const type = typeof value;
        console.log(`   ✅ ${column}: ${type} = ${JSON.stringify(value)}`);
      });
      
      console.log(`\n📊 Total de colunas: ${columns.length}`);
      
      // Verificar colunas de buffering
      const bufferingColumns = [
        'message_debounce_enabled',
        'message_debounce_time_ms',
        'message_chunk_size',
        'message_chunk_delay_ms',
        'message_max_batch_size'
      ];
      
      console.log('\n🔍 Colunas de buffering:');
      bufferingColumns.forEach(column => {
        if (columns.includes(column)) {
          console.log(`   ✅ ${column} - EXISTE`);
        } else {
          console.log(`   ❌ ${column} - NÃO EXISTE`);
        }
      });
      
    } else {
      console.log('⚠️ Tabela ai_agent_configs está vazia');
    }
    
    // 3. Se há usuários, testar inserção de agente
    if (users && users.length > 0) {
      console.log('\n3️⃣ Testando inserção de agente com usuário existente...');
      
      const testAgent = {
        name: 'Teste Estrutura - ' + new Date().toISOString(),
        owner_id: users[0].id,
        is_active: true
      };
      
      console.log('📋 Dados do teste:', JSON.stringify(testAgent, null, 2));
      
      const { data: insertData, error: insertError } = await supabase
        .from('ai_agent_configs')
        .insert([testAgent])
        .select();
      
      if (insertError) {
        console.error('❌ Erro ao inserir agente:', insertError);
      } else {
        console.log('✅ Agente inserido com sucesso!');
        console.log('📋 Dados inseridos:', JSON.stringify(insertData[0], null, 2));
        
        // Limpar dados de teste
        await supabase
          .from('ai_agent_configs')
          .delete()
          .eq('id', insertData[0].id);
        
        console.log('🧹 Dados de teste limpos');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkUsersAndStructure();
