-- Correção final da tabela contacts para usar apenas coluna phone
-- Execute este script no Supabase SQL Editor

-- 1. Verificar estrutura atual da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'contacts'
  AND column_name IN ('phone', 'phone_number')
ORDER BY column_name;

-- 2. Se a coluna phone_number existir, verificar dados
DO $$
DECLARE
    phone_number_exists boolean;
BEGIN
    -- Verificar se a coluna phone_number existe
    SELECT EXISTS(
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'contacts' 
          AND column_name = 'phone_number'
    ) INTO phone_number_exists;
    
    IF phone_number_exists THEN
        RAISE NOTICE 'Coluna phone_number encontrada. Iniciando migração de dados...';
        
        -- Migrar dados de phone_number para phone onde phone está NULL
        UPDATE public.contacts 
        SET phone = phone_number 
        WHERE phone IS NULL AND phone_number IS NOT NULL;
        
        RAISE NOTICE 'Dados migrados de phone_number para phone';
        
        -- Remover a coluna phone_number
        ALTER TABLE public.contacts DROP COLUMN IF EXISTS phone_number;
        
        RAISE NOTICE 'Coluna phone_number removida com sucesso';
    ELSE
        RAISE NOTICE 'Coluna phone_number não existe. Tabela já está correta.';
    END IF;
END $$;

-- 3. Garantir que a coluna phone existe
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 4. Verificar se há índice para phone
CREATE INDEX IF NOT EXISTS idx_contacts_phone 
ON public.contacts(phone);

-- 5. Criar constraint única para phone + owner_id (se não existir)
DO $$
BEGIN
    -- Tentar criar constraint única
    BEGIN
        ALTER TABLE public.contacts 
        ADD CONSTRAINT unique_contacts_phone_owner 
        UNIQUE (owner_id, phone);
        RAISE NOTICE 'Constraint única criada para phone + owner_id';
    EXCEPTION 
        WHEN duplicate_table THEN
            RAISE NOTICE 'Constraint única já existe para phone + owner_id';
        WHEN OTHERS THEN
            RAISE NOTICE 'Não foi possível criar constraint única (pode haver dados duplicados)';
    END;
END $$;

-- 6. Verificar estrutura final
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'contacts'
  AND column_name LIKE '%phone%'
ORDER BY column_name;

-- 7. Contar registros na tabela
SELECT 
  COUNT(*) as total_contacts,
  COUNT(phone) as contacts_with_phone,
  COUNT(CASE WHEN phone IS NULL THEN 1 END) as contacts_without_phone
FROM public.contacts;

-- 8. Verificar índices relacionados a phone
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'contacts' 
  AND indexdef LIKE '%phone%';

-- 9. Comentário de documentação
COMMENT ON COLUMN public.contacts.phone IS 'Número de telefone do contato (padrão único do sistema)';

RAISE NOTICE 'Correção da tabela contacts concluída. Agora usando apenas coluna phone.';

