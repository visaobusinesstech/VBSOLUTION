-- TESTAR CONEXÃO E INSERÇÃO NA TABELA PROJECTS
-- Execute este script no SQL Editor do Supabase

-- 1. VERIFICAR SE A TABELA EXISTE
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'projects';

-- 2. VERIFICAR ESTRUTURA COMPLETA
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'projects'
ORDER BY ordinal_position;

-- 3. VERIFICAR RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'projects';

-- 4. VERIFICAR POLÍTICAS
SELECT 
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'projects';

-- 5. VERIFICAR USUÁRIO ATUAL
SELECT 
    auth.uid() as current_user_id,
    auth.email() as current_user_email;

-- 6. VERIFICAR PERFIL DO USUÁRIO ATUAL
SELECT 
    id,
    email,
    name
FROM public.profiles 
WHERE id = auth.uid();

-- 7. TESTAR INSERÇÃO (com usuário autenticado) - USANDO APENAS COLUNAS EXISTENTES
-- NOTA: Este comando só funcionará se você estiver logado no Supabase
INSERT INTO public.projects (
    name,
    description,
    status,
    priority,
    owner_id,
    currency,
    progress,
    start_date,
    due_date,
    budget,
    company_id,
    tags,
    notes
) VALUES (
    'Projeto de Teste',
    'Este é um projeto de teste para verificar a funcionalidade',
    'planning',
    'medium',
    auth.uid(),
    'BRL',
    0,
    NOW(),
    NOW() + INTERVAL '30 days',
    1000.00,
    NULL,
    ARRAY['teste', 'verificação'],
    'Projeto criado para teste de funcionalidade'
) RETURNING *;

-- 8. VERIFICAR SE O PROJETO FOI INSERIDO
SELECT 
    id,
    name,
    description,
    status,
    priority,
    owner_id,
    created_at
FROM public.projects 
WHERE owner_id = auth.uid()
ORDER BY created_at DESC;

-- 9. VERIFICAR TOTAL DE PROJETOS
SELECT COUNT(*) as total_projects FROM public.projects;

-- 10. VERIFICAR PROJETOS POR STATUS
SELECT 
    status,
    COUNT(*) as quantidade
FROM public.projects 
GROUP BY status
ORDER BY status;
