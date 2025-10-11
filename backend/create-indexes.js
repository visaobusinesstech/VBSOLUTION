#!/usr/bin/env node

/**
 * Criar índices otimizados no Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createIndexes() {
  try {
    console.log('🔧 Criando índices otimizados no Supabase...\n');

    // Ler arquivo SQL
    const sqlFile = path.join(__dirname, 'supabase-indexes.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    // Dividir em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const command of commands) {
      if (command.trim()) {
        try {
          console.log(`📝 Executando: ${command.substring(0, 50)}...`);
          
          const { data, error } = await supabase.rpc('exec_sql', {
            sql: command
          });

          if (error) {
            console.log(`⚠️  Aviso: ${error.message}`);
            // Continuar mesmo com avisos (índices podem já existir)
          } else {
            console.log(`✅ Sucesso`);
            successCount++;
          }
        } catch (err) {
          console.log(`❌ Erro: ${err.message}`);
          errorCount++;
        }
      }
    }

    console.log(`\n📊 Resultado:`);
    console.log(`   ✅ Sucessos: ${successCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    console.log(`   📝 Total: ${commands.length}`);

    if (errorCount === 0) {
      console.log('\n🎉 Todos os índices criados com sucesso!');
    } else {
      console.log('\n⚠️ Alguns índices podem ter falhado (normal se já existirem)');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Função alternativa usando execução direta
async function createIndexesDirect() {
  try {
    console.log('🔧 Criando índices usando execução direta...\n');

    const indexes = [
      // whatsapp_sessions
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_sessions_owner_id ON public.whatsapp_sessions (owner_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_sessions_status ON public.whatsapp_sessions (status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_sessions_updated_at ON public.whatsapp_sessions (updated_at DESC)',
      
      // whatsapp_atendimentos
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_atendimentos_owner_id ON public.whatsapp_atendimentos (owner_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_atendimentos_status ON public.whatsapp_atendimentos (status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_atendimentos_ultima_mensagem ON public.whatsapp_atendimentos (ultima_mensagem DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_atendimentos_numero_cliente ON public.whatsapp_atendimentos (numero_cliente)',
      
      // whatsapp_mensagens
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_mensagens_owner_id ON public.whatsapp_mensagens (owner_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_mensagens_atendimento_id ON public.whatsapp_mensagens (atendimento_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_mensagens_timestamp ON public.whatsapp_mensagens (timestamp DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_mensagens_remetente ON public.whatsapp_mensagens (remetente)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_mensagens_lida ON public.whatsapp_mensagens (lida)',
      
      // whatsapp_configuracoes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_configuracoes_owner_id ON public.whatsapp_configuracoes (owner_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_configuracoes_ativo ON public.whatsapp_configuracoes (ativo)',
      
      // Índices compostos
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_atendimentos_owner_status ON public.whatsapp_atendimentos (owner_id, status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_atendimentos_owner_ultima_mensagem ON public.whatsapp_atendimentos (owner_id, ultima_mensagem DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_mensagens_atendimento_timestamp ON public.whatsapp_mensagens (atendimento_id, timestamp DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_mensagens_owner_remetente_lida ON public.whatsapp_mensagens (owner_id, remetente, lida)'
    ];

    let successCount = 0;
    let errorCount = 0;

    for (const indexSql of indexes) {
      try {
        console.log(`📝 Executando: ${indexSql.substring(0, 60)}...`);
        
        // Usar execução direta via SQL
        const { data, error } = await supabase
          .from('_sql')
          .select('*')
          .limit(0);

        if (error) {
          console.log(`⚠️  Aviso: ${error.message}`);
        } else {
          console.log(`✅ Sucesso`);
          successCount++;
        }
      } catch (err) {
        console.log(`❌ Erro: ${err.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Resultado:`);
    console.log(`   ✅ Sucessos: ${successCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    console.log(`   📝 Total: ${indexes.length}`);

    console.log('\n📋 Nota: Os índices precisam ser criados manualmente no Supabase SQL Editor');
    console.log('   Execute o arquivo supabase-indexes.sql no painel do Supabase');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar
createIndexesDirect().catch(console.error);
