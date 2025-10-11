-- =====================================================
-- CRIAÇÃO DA TABELA FILES E CONFIGURAÇÃO DO STORAGE
-- =====================================================

-- Criar a tabela files
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

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_files_owner_id ON files(owner_id);
CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder);
CREATE INDEX IF NOT EXISTS idx_files_favorite ON files(favorite);
CREATE INDEX IF NOT EXISTS idx_files_shared ON files(shared);
CREATE INDEX IF NOT EXISTS idx_files_private ON files(private);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_files_viewed_at ON files(viewed_at DESC NULLS LAST);

-- Função para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION update_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o updated_at
DROP TRIGGER IF EXISTS files_updated_at_trigger ON files;
CREATE TRIGGER files_updated_at_trigger
  BEFORE UPDATE ON files
  FOR EACH ROW
  EXECUTE FUNCTION update_files_updated_at();

-- =====================================================
-- POLICIES RLS (Row Level Security)
-- =====================================================

-- Ativar RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver seus próprios arquivos
CREATE POLICY "users_view_own_files" ON files
  FOR SELECT
  USING (owner_id = auth.uid());

-- Policy: Usuários podem ver arquivos compartilhados
CREATE POLICY "users_view_shared_files" ON files
  FOR SELECT
  USING (shared = TRUE);

-- Policy: Usuários podem inserir seus próprios arquivos
CREATE POLICY "users_insert_own_files" ON files
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Policy: Usuários podem atualizar seus próprios arquivos
CREATE POLICY "users_update_own_files" ON files
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Policy: Usuários podem deletar seus próprios arquivos
CREATE POLICY "users_delete_own_files" ON files
  FOR DELETE
  USING (owner_id = auth.uid());

-- =====================================================
-- CONFIGURAÇÃO DO STORAGE BUCKET
-- =====================================================

-- Criar o bucket 'files' se não existir
-- Este comando deve ser executado no painel do Supabase ou via API
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('files', 'files', false)
-- ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Policy: Usuários podem fazer upload de seus próprios arquivos
-- CREATE POLICY "users_upload_own_files" ON storage.objects
--   FOR INSERT
--   WITH CHECK (
--     bucket_id = 'files' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- Policy: Usuários podem ver seus próprios arquivos
-- CREATE POLICY "users_view_own_files_storage" ON storage.objects
--   FOR SELECT
--   USING (
--     bucket_id = 'files' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- Policy: Usuários podem deletar seus próprios arquivos
-- CREATE POLICY "users_delete_own_files_storage" ON storage.objects
--   FOR DELETE
--   USING (
--     bucket_id = 'files' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- =====================================================
-- DADOS DE EXEMPLO (OPCIONAL - REMOVA EM PRODUÇÃO)
-- =====================================================

-- Comentado para não inserir dados de exemplo automaticamente
-- INSERT INTO files (owner_id, name, path, size, type, folder, tags, favorite, shared, private, description) VALUES
-- ('user-uuid-here', 'Relatório Q1 2025.pdf', 'user-uuid-here/relatorio-q1-2025.pdf', 2048576, 'application/pdf', '/Relatórios', ARRAY['relatório', 'q1'], false, true, false, 'Relatório trimestral Q1 2025'),
-- ('user-uuid-here', 'Apresentação Cliente.pptx', 'user-uuid-here/apresentacao-cliente.pptx', 5242880, 'application/vnd.openxmlformats-officedocument.presentationml.presentation', '/Apresentações', ARRAY['apresentação', 'cliente'], true, false, false, 'Apresentação para reunião com cliente');

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para atualizar o viewed_at ao visualizar um arquivo
CREATE OR REPLACE FUNCTION update_file_viewed_at(file_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE files
  SET viewed_at = NOW()
  WHERE id = file_id AND owner_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter estatísticas de arquivos do usuário
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

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se a tabela foi criada com sucesso
SELECT 'Tabela files criada com sucesso!' AS status
WHERE EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'files'
);


