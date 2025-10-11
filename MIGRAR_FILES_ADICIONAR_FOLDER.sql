-- =====================================================
-- MIGRAÇÃO: Adicionar coluna folder à tabela files
-- =====================================================

-- Verificar se a coluna folder existe, se não, adicionar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'files' 
        AND column_name = 'folder'
    ) THEN
        ALTER TABLE files ADD COLUMN folder TEXT DEFAULT '/';
        RAISE NOTICE 'Coluna folder adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna folder já existe.';
    END IF;
END $$;

-- Criar índice na coluna folder se não existir
CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder);

-- Verificação final
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'files'
ORDER BY ordinal_position;


