-- Execute este script no Supabase SQL Editor
-- Adiciona coluna deleted_at para suporte a soft delete

-- Adicionar coluna deleted_at
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Adicionar comentário na coluna
COMMENT ON COLUMN leads.deleted_at IS 'Data e hora de exclusão do lead (soft delete)';

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_leads_deleted_at ON leads(deleted_at);

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name = 'deleted_at';

-- Testar inserção com deleted_at
INSERT INTO leads (name, email, stage_id, status, deleted_at) 
VALUES ('Teste Deleted At', 'teste@deleted.com', '550e8400-e29b-41d4-a716-446655440001', 'hot', NULL);

-- Testar filtro de leads não excluídos
SELECT id, name, deleted_at 
FROM leads 
WHERE deleted_at IS NULL 
ORDER BY created_at DESC 
LIMIT 5;

-- Limpar lead de teste
DELETE FROM leads WHERE name = 'Teste Deleted At';
