-- Script para corrigir o erro de chave estrangeira na tabela activities
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a constraint problemática existe
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    confrelid::regclass as referenced_table,
    conkey as constrained_columns
FROM pg_constraint 
WHERE conrelid = 'public.activities'::regclass
AND conname LIKE '%owner_id%';

-- 2. Remover a constraint de chave estrangeira problemática
DO $$ 
BEGIN
    -- Verificar se a constraint existe e removê-la
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.activities'::regclass 
        AND conname LIKE '%owner_id%'
    ) THEN
        -- Remover constraint de chave estrangeira
        ALTER TABLE public.activities 
        DROP CONSTRAINT IF EXISTS activities_owner_id_fkey;
        
        RAISE NOTICE 'Constraint de chave estrangeira removida com sucesso';
    ELSE
        RAISE NOTICE 'Nenhuma constraint problemática encontrada';
    END IF;
END $$;

-- 3. Verificar se a coluna owner_id existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'owner_id' 
        AND table_schema = 'public'
    ) THEN
        -- Adicionar coluna owner_id se não existir
        ALTER TABLE public.activities 
        ADD COLUMN owner_id UUID;
        
        RAISE NOTICE 'Coluna owner_id adicionada';
    ELSE
        RAISE NOTICE 'Coluna owner_id já existe';
    END IF;
END $$;

-- 4. Atualizar registros existentes com owner_id baseado no created_by (se existir)
DO $$
BEGIN
    -- Verificar se existe coluna created_by para migrar dados
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'created_by' 
        AND table_schema = 'public'
    ) THEN
        -- Migrar dados de created_by para owner_id
        UPDATE public.activities 
        SET owner_id = created_by 
        WHERE owner_id IS NULL AND created_by IS NOT NULL;
        
        RAISE NOTICE 'Dados migrados de created_by para owner_id';
    END IF;
END $$;

-- 5. Tornar owner_id NOT NULL após migração
DO $$
BEGIN
    -- Verificar se há registros com owner_id NULL
    IF EXISTS (SELECT 1 FROM public.activities WHERE owner_id IS NULL) THEN
        RAISE NOTICE 'Atenção: Existem registros com owner_id NULL. Atualize-os antes de tornar a coluna NOT NULL.';
    ELSE
        -- Tornar owner_id NOT NULL
        ALTER TABLE public.activities 
        ALTER COLUMN owner_id SET NOT NULL;
        
        RAISE NOTICE 'Coluna owner_id definida como NOT NULL';
    END IF;
END $$;

-- 6. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_activities_owner_id ON public.activities(owner_id);

-- 7. Atualizar políticas RLS para usar owner_id
DROP POLICY IF EXISTS "Users can view their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can insert their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can update their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can delete their own activities" ON public.activities;

-- Recriar políticas RLS
CREATE POLICY "Users can view their own activities" ON public.activities
    FOR SELECT USING (auth.uid()::text = owner_id::text);
    
CREATE POLICY "Users can insert their own activities" ON public.activities
    FOR INSERT WITH CHECK (auth.uid()::text = owner_id::text);
    
CREATE POLICY "Users can update their own activities" ON public.activities
    FOR UPDATE USING (auth.uid()::text = owner_id::text);
    
CREATE POLICY "Users can delete their own activities" ON public.activities
    FOR DELETE USING (auth.uid()::text = owner_id::text);

-- 8. Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'activities'
AND column_name IN ('id', 'owner_id', 'title', 'status', 'created_at')
ORDER BY ordinal_position;

-- 9. Verificar políticas RLS
SELECT 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual
FROM pg_policies 
WHERE tablename = 'activities';

-- 10. Testar inserção de uma atividade de exemplo
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Obter um ID de usuário válido
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Inserir atividade de teste
        INSERT INTO public.activities (title, description, owner_id, status) 
        VALUES ('Teste de Correção', 'Atividade de teste para verificar a correção', test_user_id, 'todo');
        
        RAISE NOTICE 'Atividade de teste inserida com sucesso';
        
        -- Remover atividade de teste
        DELETE FROM public.activities WHERE title = 'Teste de Correção';
        
        RAISE NOTICE 'Atividade de teste removida';
    ELSE
        RAISE NOTICE 'Nenhum usuário encontrado para teste';
    END IF;
END $$;

SELECT 'Correção da chave estrangeira concluída com sucesso!' as status;
