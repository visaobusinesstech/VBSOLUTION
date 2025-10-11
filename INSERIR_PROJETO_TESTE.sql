-- INSERIR PROJETO DE TESTE NA TABELA PROJECTS
-- Execute este script no SQL Editor do Supabase

-- 1. VERIFICAR USUÁRIO ATUAL
SELECT 
    auth.uid() as current_user_id,
    auth.email() as current_user_email;

-- 2. VERIFICAR PERFIL DO USUÁRIO ATUAL
SELECT 
    id,
    email,
    name
FROM public.profiles 
WHERE id = auth.uid();

-- 3. SE NÃO HOUVER USUÁRIO AUTENTICADO, USAR UM ID ESPECÍFICO
-- Primeiro, vamos pegar o ID de um usuário existente na tabela profiles
SELECT 
    id,
    email,
    name
FROM public.profiles 
LIMIT 1;

-- 4. INSERIR PROJETO DE TESTE (usando o primeiro usuário encontrado)
-- NOTA: Substitua 'USER_ID_AQUI' pelo ID real retornado na consulta anterior
DO $$
DECLARE
    user_id UUID;
BEGIN
    -- Pegar o primeiro usuário da tabela profiles
    SELECT id INTO user_id FROM public.profiles LIMIT 1;
    
    IF user_id IS NOT NULL THEN
        -- Inserir projeto de teste
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
            user_id,
            'BRL',
            0,
            NOW(),
            NOW() + INTERVAL '30 days',
            1000.00,
            NULL,
            ARRAY['teste', 'verificação'],
            'Projeto criado para teste de funcionalidade'
        );
        
        RAISE NOTICE 'Projeto de teste inserido com sucesso para o usuário: %', user_id;
    ELSE
        RAISE NOTICE 'Nenhum usuário encontrado na tabela profiles';
    END IF;
END $$;

-- 5. VERIFICAR SE O PROJETO FOI INSERIDO
SELECT 
    id,
    name,
    description,
    status,
    priority,
    owner_id,
    created_at
FROM public.projects 
ORDER BY created_at DESC
LIMIT 5;

-- 6. VERIFICAR TOTAL DE PROJETOS
SELECT COUNT(*) as total_projects FROM public.projects;

-- 7. VERIFICAR PROJETOS POR STATUS
SELECT 
    status,
    COUNT(*) as quantidade
FROM public.projects 
GROUP BY status
ORDER BY status;

-- 8. VERIFICAR PROJETOS POR USUÁRIO
SELECT 
    p.owner_id,
    pr.email,
    pr.name,
    COUNT(*) as total_projetos
FROM public.projects p
JOIN public.profiles pr ON p.owner_id = pr.id
GROUP BY p.owner_id, pr.email, pr.name
ORDER BY total_projetos DESC;
