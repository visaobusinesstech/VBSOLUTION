#!/usr/bin/env node

/**
 * 🛡️ SCRIPT DE VERIFICAÇÃO DO SISTEMA DE PROTEÇÃO (v2.0)
 * 
 * Este script verifica se o sistema está funcionando corretamente
 * e se as configurações críticas não foram alteradas.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: './env.supabase' });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';
const supabase = createClient(supabaseUrl, supabaseKey);

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
};

function log(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

function checkMark() {
  return `${COLORS.GREEN}✅${COLORS.RESET}`;
}

function crossMark() {
  return `${COLORS.RED}❌${COLORS.RESET}`;
}

function warningMark() {
  return `${COLORS.YELLOW}⚠️${COLORS.RESET}`;
}

async function verifyDatabase() {
  log('\n🔍 Verificando estrutura do banco de dados...', COLORS.BLUE);
  
  try {
    // 1. Verificar se tabela whatsapp_mensagens existe
    const { data: messages, error: messagesError } = await supabase
      .from('whatsapp_mensagens')
      .select('*')
      .limit(1);
    
    if (messagesError) {
      log(`${crossMark()} Erro ao acessar tabela whatsapp_mensagens: ${messagesError.message}`, COLORS.RED);
      return false;
    }
    
    log(`${checkMark()} Tabela whatsapp_mensagens acessível`);
    
    // 2. Verificar colunas críticas
    if (messages.length > 0) {
      const sampleMessage = messages[0];
      const requiredColumns = ['message_type', 'media_type', 'conteudo', 'atendimento_id', 'connection_id', 'phone'];
      const missingColumns = requiredColumns.filter(col => !(col in sampleMessage));
      
      if (missingColumns.length > 0) {
        log(`${crossMark()} Colunas críticas ausentes: ${missingColumns.join(', ')}`, COLORS.RED);
        return false;
      }
      
      log(`${checkMark()} Todas as colunas críticas presentes`);
      
      // 3. Verificar se atendimento_id pode ser null
      const { data: nullTest, error: nullError } = await supabase
        .from('whatsapp_mensagens')
        .insert([{
          owner_id: '00000000-0000-0000-0000-000000000000',
          atendimento_id: null,
          chat_id: 'test@c.us',
          conteudo: 'Teste de verificação',
          message_type: 'TEXTO',
          media_type: null,
          remetente: 'CLIENTE',
          timestamp: new Date().toISOString(),
          lida: false,
          message_id: 'verify_' + Date.now(),
          status: 'AGUARDANDO',
          connection_id: 'test_connection',
          phone: '2147483647',
          raw: { test: true }
        }])
        .select();
      
      if (nullError) {
        log(`${crossMark()} atendimento_id não é nullable: ${nullError.message}`, COLORS.RED);
        return false;
      }
      
      log(`${checkMark()} atendimento_id é nullable`);
      
      // Limpar mensagem de teste
      await supabase
        .from('whatsapp_mensagens')
        .delete()
        .eq('message_id', nullTest[0].message_id);
      
      log(`${checkMark()} Teste de inserção com atendimento_id null bem-sucedido`);
    }
    
    // 4. Verificar se tabela whatsapp_atendimentos foi removida
    const { data: atendimentos, error: atendimentosError } = await supabase
      .from('whatsapp_atendimentos')
      .select('*')
      .limit(1);
    
    if (!atendimentosError) {
      log(`${warningMark()} Tabela whatsapp_atendimentos ainda existe!`, COLORS.YELLOW);
    } else {
      log(`${checkMark()} Tabela whatsapp_atendimentos foi removida`);
    }
    
    return true;
    
  } catch (error) {
    log(`${crossMark()} Erro na verificação do banco: ${error.message}`, COLORS.RED);
    return false;
  }
}

function verifyFiles() {
  log('\n🔍 Verificando arquivos críticos...', COLORS.BLUE);
  
  const criticalFiles = [
    'backend/simple-baileys-server.js',
    'backend/message-normalizer.js',
    'frontend/src/contexts/ConnectionsContext.tsx',
    'frontend/src/components/ConnectionsModalProvider.tsx',
    'frontend/src/hooks/useWhatsAppConversations.ts',
    'frontend/src/pages/WhatsAppSimple.tsx'
  ];
  
  let allFilesExist = true;
  
  for (const file of criticalFiles) {
    if (fs.existsSync(file)) {
      log(`${checkMark()} ${file} existe`);
    } else {
      log(`${crossMark()} ${file} não encontrado!`, COLORS.RED);
      allFilesExist = false;
    }
  }
  
  return allFilesExist;
}

function verifyMessageNormalizer() {
  log('\n🔍 Verificando message-normalizer.js...', COLORS.BLUE);
  
  try {
    const content = fs.readFileSync('backend/message-normalizer.js', 'utf8');
    
    // Verificar se usa message_type em vez de tipo
    if (content.includes('message_type') && !content.includes("tipo:'")) {
      log(`${checkMark()} Usa message_type corretamente`);
    } else {
      log(`${crossMark()} Ainda usa 'tipo' em vez de 'message_type'`, COLORS.RED);
      return false;
    }
    
    // Verificar se tem media_type
    if (content.includes('media_type')) {
      log(`${checkMark()} Inclui media_type`);
    } else {
      log(`${crossMark()} Não inclui media_type`, COLORS.RED);
      return false;
    }
    
    // Verificar se preenche conteudo corretamente
    if (content.includes('row.conteudo =') && !content.includes("row.conteudo = ''")) {
      log(`${checkMark()} Preenche conteudo corretamente`);
    } else {
      log(`${crossMark()} Não preenche conteudo corretamente`, COLORS.RED);
      return false;
    }
    
    return true;
    
  } catch (error) {
    log(`${crossMark()} Erro ao verificar message-normalizer.js: ${error.message}`, COLORS.RED);
    return false;
  }
}

function verifyModernPage() {
  log('\n🔍 Verificando página moderna WhatsAppSimple.tsx...', COLORS.BLUE);
  
  try {
    const content = fs.readFileSync('frontend/src/pages/WhatsAppSimple.tsx', 'utf8');
    
    // Verificar se usa o hook unificado
    if (content.includes('useWhatsAppConversations')) {
      log(`${checkMark()} Usa hook unificado useWhatsAppConversations`);
    } else {
      log(`${crossMark()} Não usa hook unificado`, COLORS.RED);
      return false;
    }
    
    // Verificar se tem design moderno (3 colunas)
    if (content.includes('grid-cols-12') && content.includes('col-span-')) {
      log(`${checkMark()} Tem design moderno com 3 colunas`);
    } else {
      log(`${crossMark()} Não tem design moderno`, COLORS.RED);
      return false;
    }
    
    // Verificar se tem funcionalidades avançadas
    if (content.includes('Paperclip') && content.includes('Mic')) {
      log(`${checkMark()} Tem funcionalidades avançadas (anexos, áudio)`);
    } else {
      log(`${crossMark()} Não tem funcionalidades avançadas`, COLORS.RED);
      return false;
    }
    
    return true;
    
  } catch (error) {
    log(`${crossMark()} Erro ao verificar WhatsAppSimple.tsx: ${error.message}`, COLORS.RED);
    return false;
  }
}

async function verifyServer() {
  log('\n🔍 Verificando servidor...', COLORS.BLUE);
  
  try {
    const response = await fetch('http://localhost:3000/api/baileys-simple/health');
    const data = await response.json();
    
    if (data.status === 'ok') {
      log(`${checkMark()} Servidor está rodando`);
      return true;
    } else {
      log(`${crossMark()} Servidor não está respondendo corretamente`, COLORS.RED);
      return false;
    }
  } catch (error) {
    log(`${crossMark()} Servidor não está rodando: ${error.message}`, COLORS.RED);
    return false;
  }
}

async function main() {
  log(`${COLORS.BOLD}🛡️ VERIFICAÇÃO DO SISTEMA DE PROTEÇÃO (v2.0)${COLORS.RESET}`, COLORS.BLUE);
  log('Verificando se as configurações críticas estão corretas...\n');
  
  const results = {
    database: await verifyDatabase(),
    files: verifyFiles(),
    messageNormalizer: verifyMessageNormalizer(),
    modernPage: verifyModernPage(),
    server: await verifyServer()
  };
  
  log('\n📊 RESUMO DA VERIFICAÇÃO:', COLORS.BOLD);
  log(`Banco de dados: ${results.database ? checkMark() : crossMark()}`);
  log(`Arquivos críticos: ${results.files ? checkMark() : crossMark()}`);
  log(`Message normalizer: ${results.messageNormalizer ? checkMark() : crossMark()}`);
  log(`Página moderna: ${results.modernPage ? checkMark() : crossMark()}`);
  log(`Servidor: ${results.server ? checkMark() : crossMark()}`);
  
  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed) {
    log('\n🎉 SISTEMA FUNCIONANDO PERFEITAMENTE!', COLORS.GREEN);
    log('Todas as verificações passaram. O sistema está protegido contra desconfiguração.', COLORS.GREEN);
    log('Página moderna WhatsAppSimple.tsx está funcionando corretamente.', COLORS.GREEN);
  } else {
    log('\n⚠️ PROBLEMAS DETECTADOS!', COLORS.YELLOW);
    log('Algumas verificações falharam. Consulte o arquivo PROTECTION_SYSTEM.md para correções.', COLORS.YELLOW);
    process.exit(1);
  }
}

main().catch(console.error);
