-- Desabilitar RLS temporariamente para a tabela contacts
-- Execute este SQL no Supabase SQL Editor

-- 1. Verificar status atual do RLS
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    hasrls as has_rls
FROM pg_tables 
WHERE tablename = 'contacts' AND schemaname = 'public';

-- 2. Desabilitar RLS temporariamente
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;

-- 3. Verificar se foi desabilitado
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'contacts' AND schemaname = 'public';

-- 4. Remover todas as políticas existentes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'contacts' AND schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.contacts';
    END LOOP;
END $$;

-- 5. Verificar se as políticas foram removidas
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'contacts' AND schemaname = 'public';

-- 6. Comentário de aviso
COMMENT ON TABLE public.contacts IS 'RLS desabilitado temporariamente para permitir inserções via API. Reabilitar após configurar políticas corretas.';

