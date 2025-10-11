const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env.supabase' });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testTableStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela whatsapp_sessions...');
    
    // Tentar inserir uma sessão com as colunas que precisamos
    const testPayload = {
      owner_id: '00000000-0000-0000-0000-000000000000',
      session_name: 'Teste Conexão',
      status: 'disconnected',
      connection_id: 'test_connection_789',
      qr_code: null,
      phone: '2147483647',
      whatsapp_info: { test: 'data' },
      connected_at: null,
      disconnected_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📤 Tentando inserir payload:', JSON.stringify(testPayload, null, 2));
    
    const { data, error } = await supabase
      .from('whatsapp_sessions')
      .insert(testPayload);
    
    if (error) {
      console.error('❌ Erro ao inserir (colunas podem não existir):', error);
      
      // Tentar com payload mínimo
      const minimalPayload = {
        owner_id: '00000000-0000-0000-0000-000000000000',
        session_name: 'Teste Conexão Mínima',
        status: 'disconnected'
      };
      
      console.log('📤 Tentando inserir payload mínimo:', JSON.stringify(minimalPayload, null, 2));
      
      const { data: minimalData, error: minimalError } = await supabase
        .from('whatsapp_sessions')
        .insert(minimalPayload);
      
      if (minimalError) {
        console.error('❌ Erro ao inserir payload mínimo:', minimalError);
      } else {
        console.log('✅ Payload mínimo inserido com sucesso!');
        console.log('📋 Dados inseridos:', minimalData);
      }
      
    } else {
      console.log('✅ Payload completo inserido com sucesso!');
      console.log('📋 Dados inseridos:', data);
      
      // Limpar teste
      const { error: deleteError } = await supabase
        .from('whatsapp_sessions')
        .delete()
        .eq('session_name', 'Teste Conexão');
      
      if (deleteError) {
        console.error('❌ Erro ao limpar teste:', deleteError);
      } else {
        console.log('🧹 Teste limpo com sucesso!');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testTableStructure();
