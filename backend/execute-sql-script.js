const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env.supabase' });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLScript() {
  try {
    console.log('🔧 Executando script de correção do banco de dados...');
    
    // 1. Remover foreign key constraint primeiro
    console.log('1. Removendo foreign key constraint...');
    const { error: fkError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE whatsapp_mensagens DROP CONSTRAINT IF EXISTS whatsapp_mensagens_atendimento_id_fkey;'
    });
    
    if (fkError) {
      console.log('⚠️ Erro ao remover foreign key (pode não existir):', fkError.message);
    } else {
      console.log('✅ Foreign key constraint removida');
    }
    
    // 2. Deletar tabela whatsapp_atendimentos
    console.log('2. Deletando tabela whatsapp_atendimentos...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'DROP TABLE IF EXISTS whatsapp_atendimentos;'
    });
    
    if (dropError) {
      console.log('⚠️ Erro ao deletar tabela (pode não existir):', dropError.message);
    } else {
      console.log('✅ Tabela whatsapp_atendimentos deletada');
    }
    
    // 3. Renomear coluna 'tipo' para 'message_type' se existir
    console.log('3. Renomeando coluna tipo para message_type...');
    const { error: renameError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'whatsapp_mensagens' AND column_name = 'tipo') THEN
                ALTER TABLE whatsapp_mensagens RENAME COLUMN tipo TO message_type;
            END IF;
        END $$;
      `
    });
    
    if (renameError) {
      console.log('⚠️ Erro ao renomear coluna (pode não existir):', renameError.message);
    } else {
      console.log('✅ Coluna renomeada para message_type');
    }
    
    // 4. Adicionar coluna 'media_type' se não existir
    console.log('4. Adicionando coluna media_type...');
    const { error: addError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'whatsapp_mensagens' AND column_name = 'media_type') THEN
                ALTER TABLE whatsapp_mensagens ADD COLUMN media_type VARCHAR(50);
            END IF;
        END $$;
      `
    });
    
    if (addError) {
      console.log('⚠️ Erro ao adicionar coluna media_type:', addError.message);
    } else {
      console.log('✅ Coluna media_type adicionada');
    }
    
    // 5. Tornar atendimento_id nullable
    console.log('5. Tornando atendimento_id nullable...');
    const { error: nullableError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE whatsapp_mensagens ALTER COLUMN atendimento_id DROP NOT NULL;'
    });
    
    if (nullableError) {
      console.log('⚠️ Erro ao tornar atendimento_id nullable:', nullableError.message);
    } else {
      console.log('✅ atendimento_id agora é nullable');
    }
    
    // 6. Verificar estrutura final
    console.log('6. Verificando estrutura final...');
    const { data: columns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'whatsapp_mensagens')
      .order('ordinal_position');
    
    if (checkError) {
      console.log('⚠️ Erro ao verificar estrutura:', checkError.message);
    } else {
      console.log('📋 Estrutura final da tabela whatsapp_mensagens:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
    console.log('🎉 Script executado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao executar script:', error);
  }
}

executeSQLScript();
