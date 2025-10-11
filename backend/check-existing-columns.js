#!/usr/bin/env node

/**
 * Script para verificar quais colunas realmente existem na tabela ai_agent_configs
 */

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

console.log('🔍 Verificando colunas existentes na tabela ai_agent_configs...\n');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkExistingColumns() {
  try {
    // Tentar inserir um registro com apenas campos básicos para ver a estrutura
    const basicRecord = {
      name: 'Teste Estrutura',
      owner_id: uuidv4()
    };
    
    console.log('📝 Tentando inserir registro básico para verificar estrutura...');
    
    const { data: insertData, error: insertError } = await supabase
      .from('ai_agent_configs')
      .insert([basicRecord])
      .select();
    
    if (insertError) {
      console.error('❌ Erro ao inserir registro básico:', insertError);
      return;
    }
    
    console.log('✅ Registro básico inserido com sucesso!');
    console.log('📋 Estrutura da tabela:');
    
    const record = insertData[0];
    const columns = Object.keys(record);
    
    columns.forEach(column => {
      const value = record[column];
      const type = typeof value;
      console.log(`   ✅ ${column}: ${type} = ${JSON.stringify(value)}`);
    });
    
    console.log(`\n📊 Total de colunas encontradas: ${columns.length}`);
    
    // Verificar se as colunas de buffering existem
    const bufferingColumns = [
      'message_debounce_enabled',
      'message_debounce_time_ms',
      'message_chunk_size',
      'message_chunk_delay_ms',
      'message_max_batch_size'
    ];
    
    console.log('\n🔍 Verificando colunas de buffering:');
    bufferingColumns.forEach(column => {
      if (columns.includes(column)) {
        console.log(`   ✅ ${column} - EXISTE`);
      } else {
        console.log(`   ❌ ${column} - NÃO EXISTE`);
      }
    });
    
    // Verificar outras colunas importantes
    const importantColumns = [
      'api_key',
      'selected_model',
      'creativity_temperature',
      'max_tokens',
      'response_style',
      'language',
      'function',
      'personality',
      'knowledge_base'
    ];
    
    console.log('\n🔍 Verificando colunas importantes:');
    importantColumns.forEach(column => {
      if (columns.includes(column)) {
        console.log(`   ✅ ${column} - EXISTE`);
      } else {
        console.log(`   ❌ ${column} - NÃO EXISTE`);
      }
    });
    
    // Limpar dados de teste
    await supabase
      .from('ai_agent_configs')
      .delete()
      .eq('id', record.id);
    
    console.log('\n🧹 Dados de teste limpos');
    
    // Criar configuração apenas com colunas que existem
    console.log('\n📝 Criando configuração apenas com colunas existentes...');
    
    const existingColumnsConfig = {};
    columns.forEach(column => {
      if (column !== 'id' && column !== 'created_at' && column !== 'updated_at') {
        // Definir valores padrão baseados no tipo de coluna
        if (column === 'name') {
          existingColumnsConfig[column] = 'Agente Teste - Colunas Existentes';
        } else if (column === 'owner_id') {
          existingColumnsConfig[column] = uuidv4();
        } else if (column === 'is_active' || column === 'is_company_wide') {
          existingColumnsConfig[column] = true;
        } else if (column.includes('_ms') || column.includes('_size') || column.includes('_tokens')) {
          existingColumnsConfig[column] = 1000;
        } else if (column.includes('temperature') || column.includes('creativity')) {
          existingColumnsConfig[column] = 0.7;
        } else if (typeof record[column] === 'string') {
          existingColumnsConfig[column] = 'teste';
        } else if (typeof record[column] === 'object') {
          existingColumnsConfig[column] = {};
        } else {
          existingColumnsConfig[column] = record[column];
        }
      }
    });
    
    console.log('📋 Configuração com colunas existentes:');
    console.log(JSON.stringify(existingColumnsConfig, null, 2));
    
    // Testar inserção com colunas existentes
    const { data: testData, error: testError } = await supabase
      .from('ai_agent_configs')
      .insert([existingColumnsConfig])
      .select();
    
    if (testError) {
      console.error('❌ Erro ao inserir com colunas existentes:', testError);
    } else {
      console.log('✅ Inserção com colunas existentes bem-sucedida!');
      
      // Limpar
      await supabase
        .from('ai_agent_configs')
        .delete()
        .eq('id', testData[0].id);
      
      console.log('🧹 Dados de teste limpos');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkExistingColumns();
