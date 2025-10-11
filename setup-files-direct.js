// Script direto sem dependências - usa apenas fetch nativo do Node.js

const SUPABASE_URL = 'https://nrbsocawokmihvxfcpso.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

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
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const error = await response.text();
      // Ignorar erros de "already exists"
      if (error.includes('already exists') || error.includes('42P07') || error.includes('42710')) {
        await log(`${description} já existe (ignorando)`, 'warning');
        return { success: true, skipped: true };
      }
      throw new Error(error);
    }

    await log(`${description} - OK`, 'success');
    return { success: true };
  } catch (error) {
    await log(`${description} - ERRO: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

async function setup() {
  await log('🚀 Iniciando configuração do Sistema de Arquivos...', 'info');
  await log('', 'info');

  // 1. Criar/verificar tabela
  await log('Criando/atualizando tabela files...', 'info');
  
  await execSQL(`
    CREATE TABLE IF NOT EXISTS files (
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

  // 2. Adicionar coluna folder se não existir
  await execSQL(`
    DO $$ 
    BEGIN
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'files' 
            AND column_name = 'folder'
        ) THEN
            ALTER TABLE files ADD COLUMN folder TEXT DEFAULT '/';
        END IF;
    END $$;
  `, 'Adicionar coluna folder');

  // 3. Criar índices
  await log('Criando índices...', 'info');
  
  await execSQL('CREATE INDEX IF NOT EXISTS idx_files_owner_id ON files(owner_id);', 'Índice owner_id');
  await execSQL('CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder);', 'Índice folder');
  await execSQL('CREATE INDEX IF NOT EXISTS idx_files_favorite ON files(favorite);', 'Índice favorite');
  await execSQL('CREATE INDEX IF NOT EXISTS idx_files_shared ON files(shared);', 'Índice shared');
  await execSQL('CREATE INDEX IF NOT EXISTS idx_files_private ON files(private);', 'Índice private');
  await execSQL('CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at DESC);', 'Índice created_at');
  await execSQL('CREATE INDEX IF NOT EXISTS idx_files_viewed_at ON files(viewed_at DESC NULLS LAST);', 'Índice viewed_at');

  // 4. Criar funções
  await log('Criando funções...', 'info');
  
  await execSQL(`
    CREATE OR REPLACE FUNCTION update_files_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `, 'Função update_files_updated_at');

  await execSQL('DROP TRIGGER IF EXISTS files_updated_at_trigger ON files;', 'Remover trigger antigo');
  
  await execSQL(`
    CREATE TRIGGER files_updated_at_trigger
      BEFORE UPDATE ON files
      FOR EACH ROW
      EXECUTE FUNCTION update_files_updated_at();
  `, 'Criar trigger');

  // 5. Ativar RLS
  await log('Configurando RLS...', 'info');
  
  await execSQL('ALTER TABLE files ENABLE ROW LEVEL SECURITY;', 'Ativar RLS');

  // 6. Criar policies
  await execSQL('DROP POLICY IF EXISTS "users_view_own_files" ON files;', 'Remover policy antiga');
  await execSQL('CREATE POLICY "users_view_own_files" ON files FOR SELECT USING (owner_id = auth.uid());', 'Policy view own');

  await execSQL('DROP POLICY IF EXISTS "users_view_shared_files" ON files;', 'Remover policy antiga');
  await execSQL('CREATE POLICY "users_view_shared_files" ON files FOR SELECT USING (shared = TRUE);', 'Policy view shared');

  await execSQL('DROP POLICY IF EXISTS "users_insert_own_files" ON files;', 'Remover policy antiga');
  await execSQL('CREATE POLICY "users_insert_own_files" ON files FOR INSERT WITH CHECK (owner_id = auth.uid());', 'Policy insert');

  await execSQL('DROP POLICY IF EXISTS "users_update_own_files" ON files;', 'Remover policy antiga');
  await execSQL('CREATE POLICY "users_update_own_files" ON files FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());', 'Policy update');

  await execSQL('DROP POLICY IF EXISTS "users_delete_own_files" ON files;', 'Remover policy antiga');
  await execSQL('CREATE POLICY "users_delete_own_files" ON files FOR DELETE USING (owner_id = auth.uid());', 'Policy delete');

  // 7. Funções auxiliares
  await log('Criando funções auxiliares...', 'info');
  
  await execSQL(`
    CREATE OR REPLACE FUNCTION update_file_viewed_at(file_id UUID)
    RETURNS VOID AS $$
    BEGIN
      UPDATE files
      SET viewed_at = NOW()
      WHERE id = file_id AND owner_id = auth.uid();
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `, 'Função update_file_viewed_at');

  await execSQL(`
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

  // 8. Criar bucket
  await log('Criando bucket...', 'info');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        id: 'files',
        name: 'files',
        public: false,
        file_size_limit: 52428800
      })
    });

    if (response.ok) {
      await log('Bucket criado com sucesso!', 'success');
    } else {
      const error = await response.text();
      if (error.includes('already exists')) {
        await log('Bucket já existe', 'warning');
      } else {
        await log(`Erro ao criar bucket: ${error}`, 'error');
      }
    }
  } catch (error) {
    await log(`Erro ao criar bucket: ${error.message}`, 'error');
  }

  // 9. Policies de storage
  await log('Configurando policies de storage...', 'info');
  
  await execSQL('DROP POLICY IF EXISTS "users_upload_own_files_storage" ON storage.objects;', 'Remover policy');
  await execSQL(`
    CREATE POLICY "users_upload_own_files_storage" ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'files' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
  `, 'Policy upload storage');

  await execSQL('DROP POLICY IF EXISTS "users_view_own_files_storage" ON storage.objects;', 'Remover policy');
  await execSQL(`
    CREATE POLICY "users_view_own_files_storage" ON storage.objects
      FOR SELECT
      USING (
        bucket_id = 'files' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
  `, 'Policy view storage');

  await execSQL('DROP POLICY IF EXISTS "users_delete_own_files_storage" ON storage.objects;', 'Remover policy');
  await execSQL(`
    CREATE POLICY "users_delete_own_files_storage" ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'files' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
  `, 'Policy delete storage');

  await log('', 'info');
  await log('🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!', 'success');
  await log('', 'info');
  await log('✨ Sistema de arquivos pronto para uso!', 'success');
  await log('   Acesse /files no seu CRM para começar a usar.', 'info');
}

setup().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});


