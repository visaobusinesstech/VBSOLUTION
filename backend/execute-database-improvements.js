const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeDatabaseImprovements() {
  try {
    console.log('=== EXECUTANDO MELHORIAS NO BANCO DE DADOS ===');
    
    // 1. Adicionar coluna phone
    console.log('1. Adicionando coluna phone...');
    const { error: phoneError } = await supabase.rpc('exec', {
      sql: `
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'whatsapp_mensagens' AND column_name = 'phone') THEN
                ALTER TABLE whatsapp_mensagens ADD COLUMN phone TEXT;
            END IF;
        END $$;
      `
    });
    
    if (phoneError) {
      console.log('Erro ao adicionar phone:', phoneError);
    } else {
      console.log('✅ Coluna phone adicionada');
    }
    
    // 2. Preencher phone com dados existentes
    console.log('2. Preenchendo phone com dados existentes...');
    const { error: updateError } = await supabase.rpc('exec', {
      sql: `
        UPDATE whatsapp_mensagens 
        SET phone = SPLIT_PART(chat_id, '@', 1)
        WHERE phone IS NULL;
      `
    });
    
    if (updateError) {
      console.log('Erro ao preencher phone:', updateError);
    } else {
      console.log('✅ phone preenchido');
    }
    
    // 3. Adicionar coluna connection_phone
    console.log('3. Adicionando coluna connection_phone...');
    const { error: connPhoneError } = await supabase.rpc('exec', {
      sql: `
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'whatsapp_mensagens' AND column_name = 'connection_phone') THEN
                ALTER TABLE whatsapp_mensagens ADD COLUMN connection_phone TEXT;
            END IF;
        END $$;
      `
    });
    
    if (connPhoneError) {
      console.log('Erro ao adicionar connection_phone:', connPhoneError);
    } else {
      console.log('✅ Coluna connection_phone adicionada');
    }
    
    // 4. Adicionar coluna connection_id
    console.log('4. Adicionando coluna connection_id...');
    const { error: connIdError } = await supabase.rpc('exec', {
      sql: `
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'whatsapp_mensagens' AND column_name = 'connection_id') THEN
                ALTER TABLE whatsapp_mensagens ADD COLUMN connection_id TEXT;
            END IF;
        END $$;
      `
    });
    
    if (connIdError) {
      console.log('Erro ao adicionar connection_id:', connIdError);
    } else {
      console.log('✅ Coluna connection_id adicionada');
    }
    
    // 5. Criar índices para melhor performance
    console.log('5. Criando índices...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_phone ON whatsapp_mensagens(phone);',
      'CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_connection_phone ON whatsapp_mensagens(connection_phone);',
      'CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_connection_id ON whatsapp_mensagens(connection_id);',
      'CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_chat_id ON whatsapp_mensagens(chat_id);',
      'CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_timestamp ON whatsapp_mensagens(timestamp);'
    ];
    
    for (const indexSql of indexes) {
      const { error: indexError } = await supabase.rpc('exec', { sql: indexSql });
      if (indexError) {
        console.log('Erro ao criar índice:', indexError);
      } else {
        console.log('✅ Índice criado');
      }
    }
    
    // 6. Verificar estrutura final
    console.log('6. Verificando estrutura final...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'whatsapp_mensagens')
      .order('ordinal_position');
    
    if (columnsError) {
      console.log('Erro ao verificar colunas:', columnsError);
    } else {
      console.log('\n=== ESTRUTURA FINAL DA TABELA ===');
      columns.forEach(col => {
        console.log(`${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }
    
    console.log('\n✅ Melhorias no banco de dados executadas com sucesso!');
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

executeDatabaseImprovements();
