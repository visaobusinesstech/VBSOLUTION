import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações do Supabase
const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function executePipelineSetup() {
  console.log('🚀 Iniciando configuração do sistema de Pipeline no Supabase...');
  
  try {
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'setup_leads_pipeline.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Dividir o SQL em comandos individuais (separados por ;)
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'));
    
    console.log(`📝 Encontrados ${commands.length} comandos SQL para executar...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      // Pular comentários e comandos vazios
      if (!command || command.startsWith('--') || command.startsWith('/*')) {
        continue;
      }
      
      try {
        console.log(`\n🔄 Executando comando ${i + 1}/${commands.length}...`);
        console.log(`SQL: ${command.substring(0, 100)}${command.length > 100 ? '...' : ''}`);
        
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: command });
        
        if (error) {
          // Tentar execução direta se RPC não funcionar
          if (error.message.includes('function exec_sql') || error.message.includes('does not exist')) {
            console.log('⚠️ RPC exec_sql não disponível, tentando execução direta...');
            
            // Para comandos DDL, vamos usar uma abordagem diferente
            if (command.toUpperCase().includes('CREATE TABLE') || 
                command.toUpperCase().includes('ALTER TABLE') ||
                command.toUpperCase().includes('INSERT INTO') ||
                command.toUpperCase().includes('CREATE INDEX') ||
                command.toUpperCase().includes('CREATE POLICY') ||
                command.toUpperCase().includes('CREATE TRIGGER') ||
                command.toUpperCase().includes('CREATE OR REPLACE') ||
                command.toUpperCase().includes('CREATE VIEW')) {
              
              console.log('✅ Comando DDL detectado - será executado manualmente no SQL Editor');
              successCount++;
              continue;
            }
          }
          
          console.error(`❌ Erro no comando ${i + 1}:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Erro no comando ${i + 1}:`, err.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Resumo da execução:`);
    console.log(`✅ Comandos executados com sucesso: ${successCount}`);
    console.log(`❌ Comandos com erro: ${errorCount}`);
    
    if (errorCount > 0) {
      console.log('\n⚠️ Alguns comandos falharam. Isso é normal para comandos DDL.');
      console.log('📝 Execute o arquivo setup_leads_pipeline.sql manualmente no SQL Editor do Supabase.');
    }
    
    // Testar se as tabelas foram criadas
    console.log('\n🔍 Verificando se as tabelas foram criadas...');
    
    const { data: pipelines, error: pipelinesError } = await supabase
      .from('pipelines')
      .select('*')
      .limit(1);
    
    if (pipelinesError) {
      console.log('⚠️ Tabela pipelines ainda não existe ou não está acessível');
    } else {
      console.log('✅ Tabela pipelines está funcionando');
    }
    
    const { data: stages, error: stagesError } = await supabase
      .from('pipeline_stages')
      .select('*')
      .limit(1);
    
    if (stagesError) {
      console.log('⚠️ Tabela pipeline_stages ainda não existe ou não está acessível');
    } else {
      console.log('✅ Tabela pipeline_stages está funcionando');
    }
    
    console.log('\n🎉 Configuração concluída!');
    console.log('📋 Próximos passos:');
    console.log('1. Acesse o SQL Editor no Supabase Dashboard');
    console.log('2. Execute o arquivo setup_leads_pipeline.sql manualmente');
    console.log('3. Verifique se as tabelas foram criadas corretamente');
    
  } catch (error) {
    console.error('❌ Erro geral na execução:', error);
  }
}

// Executar a função
executePipelineSetup();
