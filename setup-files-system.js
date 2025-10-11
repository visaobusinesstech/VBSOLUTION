const { createClient } = require('@supabase/supabase-js');

// Credenciais do Supabase
const SUPABASE_URL = 'https://nrbsocawokmihvxfcpso.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

let stats = {
  tables: 0,
  columns: 0,
  indexes: 0,
  policies: 0,
  functions: 0,
  buckets: 0,
  errors: []
};

async function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = {
    info: '📘',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  }[type] || 'ℹ️';
  
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

async function execSQL(sql, description) {
  try {
    await log(`Executando: ${description}...`, 'info');
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
      // Ignorar erros de "already exists"
      if (error.message.includes('already exists') || 
          error.code === '42P07' || 
          error.code === '42710') {
        await log(`${description} já existe (ignorando)`, 'warning');
        return { success: true, skipped: true };
      }
      throw error;
    }
    
    await log(`${description} - OK`, 'success');
    return { success: true, data };
  } catch (error) {
    await log(`${description} - ERRO: ${error.message}`, 'error');
    stats.errors.push({ description, error: error.message });
    return { success: false, error };
  }
}

async function checkTableExists() {
  const { data, error } = await supabase
    .from('files')
    .select('id')
    .limit(1);
  
  return !error || error.code !== '42P01'; // 42P01 = table does not exist
}

async function checkColumnExists(columnName) {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'files' 
        AND column_name = '${columnName}'
      ) as exists;
    `
  });
  
  return data && data[0]?.exists;
}

async function setupFilesSystem() {
  await log('🚀 Iniciando configuração do Sistema de Arquivos...', 'info');
  await log('', 'info');

  // Passo 1: Verificar se a tabela existe
  const tableExists = await checkTableExists();
  
  if (tableExists) {
    await log('Tabela files já existe. Verificando estrutura...', 'warning');
    
    // Verificar e adicionar coluna folder se necessário
    const hasFolderColumn = await checkColumnExists('folder');
    
    if (!hasFolderColumn) {
      await log('Adicionando coluna folder...', 'info');
      await execSQL(
        `ALTER TABLE files ADD COLUMN folder TEXT DEFAULT '/';`,
        'Adicionar coluna folder'
      );
      stats.columns++;
    } else {
      await log('Coluna folder já existe', 'success');
    }
    
  } else {
    // Criar tabela completa
    await log('Criando tabela files...', 'info');
    const result = await execSQL(`
      CREATE TABLE files (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        size BIGINT NOT NULL,
        type TEXT NOT NULL,
        folder TEXT DEFAULT '/',
        tags TEXT[] DEFAULT '{}',
        favorite BOOLEAN DEFAULT FALSE,
        shared BOOLEAN DEFAULT FALSE,
        private BOOLEAN DEFAULT FALSE,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        viewed_at TIMESTAMPTZ
      );
    `, 'Criar tabela files');
    
    if (result.success) stats.tables++;
  }

  await log('', 'info');

  // Passo 2: Criar índices
  await log('📇 Criando índices...', 'info');
  
  const indexes = [
    ['idx_files_owner_id', 'owner_id'],
    ['idx_files_folder', 'folder'],
    ['idx_files_favorite', 'favorite'],
    ['idx_files_shared', 'shared'],
    ['idx_files_private', 'private'],
  ];
  
  for (const [indexName, column] of indexes) {
    const result = await execSQL(
      `CREATE INDEX IF NOT EXISTS ${indexName} ON files(${column});`,
      `Índice ${indexName}`
    );
    if (result.success && !result.skipped) stats.indexes++;
  }
  
  // Índices com ordenação
  await execSQL(
    `CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at DESC);`,
    'Índice idx_files_created_at'
  );
  
  await execSQL(
    `CREATE INDEX IF NOT EXISTS idx_files_viewed_at ON files(viewed_at DESC NULLS LAST);`,
    'Índice idx_files_viewed_at'
  );

  await log('', 'info');

  // Passo 3: Criar função de atualização
  await log('⚙️ Criando funções...', 'info');
  
  const result1 = await execSQL(`
    CREATE OR REPLACE FUNCTION update_files_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `, 'Função update_files_updated_at');
  if (result1.success) stats.functions++;

  // Criar trigger
  await execSQL(`
    DROP TRIGGER IF EXISTS files_updated_at_trigger ON files;
  `, 'Remover trigger antigo (se existir)');
  
  await execSQL(`
    CREATE TRIGGER files_updated_at_trigger
      BEFORE UPDATE ON files
      FOR EACH ROW
      EXECUTE FUNCTION update_files_updated_at();
  `, 'Criar trigger files_updated_at_trigger');

  await log('', 'info');

  // Passo 4: Ativar RLS
  await log('🔒 Configurando segurança (RLS)...', 'info');
  
  await execSQL(
    `ALTER TABLE files ENABLE ROW LEVEL SECURITY;`,
    'Ativar RLS'
  );

  // Passo 5: Criar policies
  const policies = [
    {
      name: 'users_view_own_files',
      sql: `CREATE POLICY "users_view_own_files" ON files FOR SELECT USING (owner_id = auth.uid());`
    },
    {
      name: 'users_view_shared_files',
      sql: `CREATE POLICY "users_view_shared_files" ON files FOR SELECT USING (shared = TRUE);`
    },
    {
      name: 'users_insert_own_files',
      sql: `CREATE POLICY "users_insert_own_files" ON files FOR INSERT WITH CHECK (owner_id = auth.uid());`
    },
    {
      name: 'users_update_own_files',
      sql: `CREATE POLICY "users_update_own_files" ON files FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());`
    },
    {
      name: 'users_delete_own_files',
      sql: `CREATE POLICY "users_delete_own_files" ON files FOR DELETE USING (owner_id = auth.uid());`
    }
  ];

  for (const policy of policies) {
    // Tentar remover policy existente primeiro
    await execSQL(
      `DROP POLICY IF EXISTS "${policy.name}" ON files;`,
      `Remover policy ${policy.name} (se existir)`
    );
    
    const result = await execSQL(policy.sql, `Policy ${policy.name}`);
    if (result.success) stats.policies++;
  }

  await log('', 'info');

  // Passo 6: Criar funções auxiliares
  await log('🛠️ Criando funções auxiliares...', 'info');
  
  const result2 = await execSQL(`
    CREATE OR REPLACE FUNCTION update_file_viewed_at(file_id UUID)
    RETURNS VOID AS $$
    BEGIN
      UPDATE files
      SET viewed_at = NOW()
      WHERE id = file_id AND owner_id = auth.uid();
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `, 'Função update_file_viewed_at');
  if (result2.success) stats.functions++;

  const result3 = await execSQL(`
    CREATE OR REPLACE FUNCTION get_user_files_stats(user_id UUID)
    RETURNS JSON AS $$
    DECLARE
      result JSON;
    BEGIN
      SELECT json_build_object(
        'total_files', COUNT(*),
        'total_size', COALESCE(SUM(size), 0),
        'favorites_count', COUNT(*) FILTER (WHERE favorite = true),
        'shared_count', COUNT(*) FILTER (WHERE shared = true),
        'private_count', COUNT(*) FILTER (WHERE private = true)
      ) INTO result
      FROM files
      WHERE owner_id = user_id;
      
      RETURN result;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `, 'Função get_user_files_stats');
  if (result3.success) stats.functions++;

  await log('', 'info');

  // Passo 7: Criar bucket de storage
  await log('🗃️ Criando bucket de storage...', 'info');
  
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === 'files');
    
    if (bucketExists) {
      await log('Bucket "files" já existe', 'warning');
    } else {
      const { data, error } = await supabase.storage.createBucket('files', {
        public: false,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: null
      });
      
      if (error) {
        if (error.message.includes('already exists')) {
          await log('Bucket "files" já existe', 'warning');
        } else {
          throw error;
        }
      } else {
        await log('Bucket "files" criado com sucesso!', 'success');
        stats.buckets++;
      }
    }
  } catch (error) {
    await log(`Erro ao criar bucket: ${error.message}`, 'error');
    stats.errors.push({ description: 'Criar bucket', error: error.message });
  }

  await log('', 'info');

  // Passo 8: Configurar policies de storage
  await log('🔐 Configurando policies de storage...', 'info');
  
  const storagePolicies = [
    {
      name: 'users_upload_own_files_storage',
      sql: `
        CREATE POLICY "users_upload_own_files_storage" ON storage.objects
          FOR INSERT
          WITH CHECK (
            bucket_id = 'files' AND
            auth.uid()::text = (storage.foldername(name))[1]
          );
      `
    },
    {
      name: 'users_view_own_files_storage',
      sql: `
        CREATE POLICY "users_view_own_files_storage" ON storage.objects
          FOR SELECT
          USING (
            bucket_id = 'files' AND
            auth.uid()::text = (storage.foldername(name))[1]
          );
      `
    },
    {
      name: 'users_delete_own_files_storage',
      sql: `
        CREATE POLICY "users_delete_own_files_storage" ON storage.objects
          FOR DELETE
          USING (
            bucket_id = 'files' AND
            auth.uid()::text = (storage.foldername(name))[1]
          );
      `
    }
  ];

  for (const policy of storagePolicies) {
    // Tentar remover policy existente
    await execSQL(
      `DROP POLICY IF EXISTS "${policy.name}" ON storage.objects;`,
      `Remover policy de storage ${policy.name} (se existir)`
    );
    
    await execSQL(policy.sql, `Policy de storage ${policy.name}`);
  }

  await log('', 'info');
  await log('', 'info');
  await log('🎉 CONFIGURAÇÃO CONCLUÍDA!', 'success');
  await log('', 'info');
  await log('📊 Resumo:', 'info');
  await log(`   • Tabelas criadas: ${stats.tables}`, 'info');
  await log(`   • Colunas adicionadas: ${stats.columns}`, 'info');
  await log(`   • Índices criados: ${stats.indexes}`, 'info');
  await log(`   • Policies criadas: ${stats.policies}`, 'info');
  await log(`   • Funções criadas: ${stats.functions}`, 'info');
  await log(`   • Buckets criados: ${stats.buckets}`, 'info');
  
  if (stats.errors.length > 0) {
    await log('', 'info');
    await log(`⚠️ Erros encontrados: ${stats.errors.length}`, 'warning');
    stats.errors.forEach(err => {
      console.log(`   - ${err.description}: ${err.error}`);
    });
  }
  
  await log('', 'info');
  await log('✨ Sistema de arquivos pronto para uso!', 'success');
  await log('   Acesse /files no seu CRM para começar a usar.', 'info');
}

// Executar
setupFilesSystem().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});


