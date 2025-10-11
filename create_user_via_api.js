// Script para criar usuário via API do Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDA1M30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxYamuLjvZm0_OU0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUserViaAPI() {
  console.log('🔄 Criando usuário via API...');

  try {
    // Tentar criar usuário usando o service role key
    const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Primeiro, tentar inserir diretamente na tabela users
    console.log('👤 Tentando inserir usuário na tabela users...');
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert([{
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        email: 'teste@empresa.com',
        name: 'Usuário Teste'
      }])
      .select();

    if (userError) {
      console.error('❌ Erro ao criar usuário:', userError.message);
      
      // Se a tabela não existe, vamos tentar criar via SQL
      console.log('🔧 Tentando criar tabela users via SQL...');
      const { data: createResult, error: createError } = await supabaseAdmin
        .rpc('exec', {
          sql: `
            CREATE TABLE IF NOT EXISTS users (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              email TEXT UNIQUE NOT NULL,
              name TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            INSERT INTO users (id, email, name) 
            VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'teste@empresa.com', 'Usuário Teste')
            ON CONFLICT (id) DO NOTHING;
          `
        });

      if (createError) {
        console.error('❌ Erro ao criar tabela via SQL:', createError.message);
      } else {
        console.log('✅ Tabela users criada via SQL');
      }
    } else {
      console.log('✅ Usuário criado com sucesso:', user);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createUserViaAPI();
