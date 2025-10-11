// Script para criar usuário no auth.users (se possível)
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://nrbsocawokmihvxfcpso.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function createAuthUser() {
  console.log('👤 Tentando criar usuário no auth.users...');
  
  try {
    // Tentar inserir diretamente na tabela auth.users
    const { data: insertedUser, error: userError } = await supabase
      .from('auth.users')
      .insert([{
        id: '00000000-0000-0000-0000-000000000001',
        email: 'teste@exemplo.com',
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();
    
    if (userError) {
      console.error('❌ Erro ao criar usuário no auth.users:', userError.message);
      console.log('⚠️ Isso é esperado, pois auth.users é gerenciado pelo Supabase Auth');
      return;
    }
    
    console.log('✅ Usuário criado no auth.users:', insertedUser[0]);
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

// Executar criação
createAuthUser();
