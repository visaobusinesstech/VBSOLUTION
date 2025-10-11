-- Script para corrigir políticas RLS da tabela company_settings
-- Execute este script no SQL Editor do Supabase

-- 1. Primeiro, verificar se a tabela existe e sua estrutura
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'company_settings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar políticas RLS atuais
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'company_settings';

-- 3. Remover políticas RLS existentes (se houver)
DROP POLICY IF EXISTS "Allow all operations on company_settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can manage company_settings" ON public.company_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.company_settings;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.company_settings;
DROP POLICY IF EXISTS "Enable update for users based on company_id" ON public.company_settings;
DROP POLICY IF EXISTS "Enable delete for users based on company_id" ON public.company_settings;

-- 4. Desabilitar RLS temporariamente para permitir operações
ALTER TABLE public.company_settings DISABLE ROW LEVEL SECURITY;

-- 5. Verificar se RLS foi desabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'company_settings' AND schemaname = 'public';

-- 6. Testar inserção de dados de exemplo
INSERT INTO public.company_settings (
    company_id,
    company_name,
    default_language,
    default_timezone,
    default_currency,
    datetime_format,
    primary_color,
    secondary_color,
    accent_color,
    sidebar_color,
    topbar_color,
    button_color,
    enable_2fa,
    password_policy
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Empresa Padrão',
    'pt-BR',
    'America/Sao_Paulo',
    'BRL',
    'DD/MM/YYYY HH:mm',
    '#021529',
    '#ffffff',
    '#3b82f6',
    '#dee2e3',
    '#3F30F1',
    '#4A5477',
    false,
    '{"min_length": 8, "require_numbers": true, "require_uppercase": true, "require_special": true}'::jsonb
) ON CONFLICT (company_id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    updated_at = NOW();

-- 7. Verificar se os dados foram inseridos
SELECT * FROM public.company_settings WHERE company_id = '11111111-1111-1111-1111-111111111111';

-- 8. Reabilitar RLS com políticas mais permissivas
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- 9. Criar políticas RLS mais permissivas
CREATE POLICY "Allow all authenticated users to read company_settings" 
ON public.company_settings FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow all authenticated users to insert company_settings" 
ON public.company_settings FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to update company_settings" 
ON public.company_settings FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to delete company_settings" 
ON public.company_settings FOR DELETE 
TO authenticated 
USING (true);

-- 10. Verificar políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'company_settings';

-- 11. Testar consulta final
SELECT * FROM public.company_settings LIMIT 5;
