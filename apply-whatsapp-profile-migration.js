// apply-whatsapp-profile-migration.js
// Script para aplicar a migração das colunas de perfil WhatsApp

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🔄 [MIGRATION] Aplicando migração de colunas de perfil WhatsApp...');
  
  try {
    // Ler o arquivo SQL de migração
    const migrationPath = path.join(__dirname, 'add_whatsapp_profile_columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 [MIGRATION] Arquivo de migração carregado:', migrationPath);
    
    // Executar a migração
    console.log('⚡ [MIGRATION] Executando migração...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      console.error('❌ [MIGRATION] Erro ao executar migração:', error);
      
      // Tentar executar comandos SQL individualmente
      console.log('🔄 [MIGRATION] Tentando executar comandos individualmente...');
      await executeMigrationCommands();
    } else {
      console.log('✅ [MIGRATION] Migração executada com sucesso!');
    }
    
    // Verificar estrutura final
    await verifyMigration();
    
  } catch (error) {
    console.error('❌ [MIGRATION] Erro geral:', error);
  }
}

async function executeMigrationCommands() {
  const commands = [
    // Colunas para grupos na tabela contacts
    "ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS whatsapp_is_group BOOLEAN DEFAULT false;",
    "ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS whatsapp_group_subject TEXT;",
    "ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS whatsapp_group_description TEXT;",
    "ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS whatsapp_group_owner TEXT;",
    "ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS whatsapp_group_admins JSONB;",
    "ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS whatsapp_group_participants JSONB;",
    "ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS whatsapp_group_created TIMESTAMPTZ;",
    "ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS whatsapp_group_settings JSONB;",
    
    // Colunas para negócio na tabela contacts
    "ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS whatsapp_business_name TEXT;",
    "ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS whatsapp_business_description TEXT;",
    "ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS whatsapp_business_category TEXT;",
    "ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS whatsapp_business_email TEXT;",
    "ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS whatsapp_business_website TEXT;",
    "ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS whatsapp_business_address TEXT;",
    "ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS whatsapp_verified BOOLEAN DEFAULT false;",
    
    // Colunas para status na tabela contacts
    "ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS whatsapp_online BOOLEAN DEFAULT false;",
    "ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS whatsapp_blocked BOOLEAN DEFAULT false;",
    "ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS whatsapp_muted BOOLEAN DEFAULT false;",
    "ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS whatsapp_pinned BOOLEAN DEFAULT false;",
    "ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS whatsapp_archived BOOLEAN DEFAULT false;",
    "ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS whatsapp_status TEXT;",
    "ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS whatsapp_last_seen TIMESTAMPTZ;",
    
    // Colunas para dados brutos na tabela contacts
    "ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS whatsapp_raw_data JSONB;",
    "ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS whatsapp_presence JSONB;",
    
    // Colunas para grupos na tabela whatsapp_mensagens
    "ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS whatsapp_is_group BOOLEAN DEFAULT false;",
    "ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS whatsapp_group_subject TEXT;",
    "ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS whatsapp_group_description TEXT;",
    "ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS whatsapp_group_owner TEXT;",
    "ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS whatsapp_group_admins JSONB;",
    "ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS whatsapp_group_participants JSONB;",
    "ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS whatsapp_group_created TIMESTAMPTZ;",
    "ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS whatsapp_group_settings JSONB;",
    
    // Colunas para negócio na tabela whatsapp_mensagens
    "ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS whatsapp_business_name TEXT;",
    "ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS whatsapp_business_description TEXT;",
    "ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS whatsapp_business_category TEXT;",
    "ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS whatsapp_business_email TEXT;",
    "ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS whatsapp_business_website TEXT;",
    "ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS whatsapp_business_address TEXT;",
    "ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS whatsapp_verified BOOLEAN DEFAULT false;",
    
    // Colunas para status na tabela whatsapp_mensagens
    "ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS whatsapp_online BOOLEAN DEFAULT false;",
    "ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS whatsapp_blocked BOOLEAN DEFAULT false;",
    "ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS whatsapp_muted BOOLEAN DEFAULT false;",
    "ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS whatsapp_pinned BOOLEAN DEFAULT false;",
    "ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS whatsapp_archived BOOLEAN DEFAULT false;",
    "ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS whatsapp_status TEXT;",
    "ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS whatsapp_last_seen TIMESTAMPTZ;",
    
    // Colunas para dados brutos na tabela whatsapp_mensagens
    "ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS whatsapp_raw_data JSONB;",
    "ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS whatsapp_presence JSONB;",
    
    // Colunas para informações de contato na tabela whatsapp_mensagens
    "ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS wpp_name TEXT;",
    "ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS group_contact_name TEXT;",
    "ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'TEXTO';",
    "ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS media_type TEXT;",
    "ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS media_mime TEXT;",
    "ALTER TABLE public.whatsapp_mensagens ADD COLUMN IF NOT EXISTS duration_ms INTEGER;"
  ];
  
  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    console.log(`⚡ [MIGRATION] Executando comando ${i + 1}/${commands.length}...`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: command });
      if (error) {
        console.error(`❌ [MIGRATION] Erro no comando ${i + 1}:`, error.message);
      } else {
        console.log(`✅ [MIGRATION] Comando ${i + 1} executado com sucesso`);
      }
    } catch (cmdError) {
      console.error(`❌ [MIGRATION] Erro no comando ${i + 1}:`, cmdError.message);
    }
    
    // Pequena pausa entre comandos
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function verifyMigration() {
  console.log('🔍 [MIGRATION] Verificando migração...');
  
  try {
    // Verificar colunas da tabela contacts
    const { data: contactsColumns, error: contactsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'contacts')
      .eq('table_schema', 'public')
      .like('column_name', 'whatsapp_%')
      .order('ordinal_position');
    
    if (contactsError) {
      console.error('❌ [MIGRATION] Erro ao verificar colunas da tabela contacts:', contactsError);
    } else {
      console.log('✅ [MIGRATION] Colunas WhatsApp na tabela contacts:', contactsColumns.length);
      contactsColumns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    }
    
    // Verificar colunas da tabela whatsapp_mensagens
    const { data: messagesColumns, error: messagesError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'whatsapp_mensagens')
      .eq('table_schema', 'public')
      .like('column_name', 'whatsapp_%')
      .order('ordinal_position');
    
    if (messagesError) {
      console.error('❌ [MIGRATION] Erro ao verificar colunas da tabela whatsapp_mensagens:', messagesError);
    } else {
      console.log('✅ [MIGRATION] Colunas WhatsApp na tabela whatsapp_mensagens:', messagesColumns.length);
      messagesColumns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    }
    
    console.log('✅ [MIGRATION] Verificação concluída!');
    
  } catch (error) {
    console.error('❌ [MIGRATION] Erro na verificação:', error);
  }
}

// Executar migração
applyMigration();
