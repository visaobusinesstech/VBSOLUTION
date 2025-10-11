// Script para criar usuário de teste
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://nrbsocawokmihvxfcpso.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function createTestUser() {
  console.log('👤 Criando usuário de teste...');
  
  try {
    const user = {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Usuário Teste',
      email: 'teste@exemplo.com'
    };
    
    const { data: insertedUser, error: userError } = await supabase
      .from('user_profiles')
      .upsert(user, { onConflict: 'id' })
      .select();
    
    if (userError) {
      console.error('❌ Erro ao criar usuário:', userError.message);
      return;
    }
    
    console.log('✅ Usuário criado com sucesso:', insertedUser[0]);
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

// Executar criação
createTestUser();