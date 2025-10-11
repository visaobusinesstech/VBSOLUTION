const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env.supabase' });

const supabaseUrl = process.env.SUPABASE_URL || 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkContactsTable() {
  try {
    console.log('🔍 Verificando estrutura da tabela contacts...');
    
    // Tentar buscar contatos
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Erro ao buscar contatos:', error);
      return;
    }

    console.log('✅ Tabela contacts encontrada!');
    console.log('📊 Estrutura dos dados:', contacts.length > 0 ? Object.keys(contacts[0]) : 'Tabela vazia');
    
    if (contacts.length > 0) {
      console.log('📝 Exemplo de contato:', contacts[0]);
    }

    // Verificar se a tabela tem as colunas necessárias
    const { data: sampleContact, error: sampleError } = await supabase
      .from('contacts')
      .select('id, name, phone, email, company, status, pipeline, tags, whatsapp_opted, created_at, updated_at, last_contact_at')
      .limit(1);

    if (sampleError) {
      console.error('❌ Erro ao verificar colunas:', sampleError);
    } else {
      console.log('✅ Todas as colunas necessárias estão presentes!');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkContactsTable();
