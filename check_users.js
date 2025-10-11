// Script para verificar usuários existentes
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  console.log('🔍 Verificando usuários existentes...');

  try {
    // Verificar users
    console.log('📋 Verificando tabela users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(5);

    if (usersError) {
      console.error('❌ Erro na tabela users:', usersError.message);
    } else {
      console.log('✅ users encontrados:', users?.length || 0);
      if (users && users.length > 0) {
        console.log('👤 Primeiro usuário:', users[0]);
      }
    }

    // Verificar user_profiles
    console.log('📋 Verificando tabela user_profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, email')
      .limit(5);

    if (profilesError) {
      console.error('❌ Erro na tabela user_profiles:', profilesError.message);
    } else {
      console.log('✅ user_profiles encontrados:', profiles?.length || 0);
      if (profiles && profiles.length > 0) {
        console.log('👤 Primeiro perfil:', profiles[0]);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkUsers();
