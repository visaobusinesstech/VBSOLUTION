// Script para obter o ID correto do usuário da tabela users
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getCorrectUserId() {
  console.log('🔍 Obtendo ID correto do usuário...');

  try {
    // Buscar da tabela users
    console.log('📋 Buscando da tabela users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name')
      .limit(5);

    if (usersError) {
      console.error('❌ Erro na tabela users:', usersError.message);
    } else {
      console.log('✅ Usuários encontrados na tabela users:', users);
      if (users && users.length > 0) {
        console.log('🎯 Use este ID para os leads:', users[0].id);
        return users[0].id;
      }
    }

    // Buscar da tabela user_profiles
    console.log('📋 Buscando da tabela user_profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, email, name')
      .limit(5);

    if (profilesError) {
      console.error('❌ Erro na tabela user_profiles:', profilesError.message);
    } else {
      console.log('✅ Perfis encontrados na tabela user_profiles:', profiles);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

getCorrectUserId();
