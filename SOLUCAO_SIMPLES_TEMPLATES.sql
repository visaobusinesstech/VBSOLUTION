-- Solução simples para o problema de user_id null na tabela templates
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar templates existentes
SELECT 
    id,
    nome,
    user_id,
    owner_id,
    canal,
    status,
    created_at
FROM public.templates
ORDER BY created_at DESC;

-- 2. Se não houver templates, vamos criar um manualmente
-- Primeiro, vamos pegar o ID do primeiro usuário
DO $$
DECLARE
    first_user_id UUID;
BEGIN
    -- Pegar o ID do primeiro usuário
    SELECT id INTO first_user_id 
    FROM auth.users 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    -- Se não houver usuários, criar um template genérico
    IF first_user_id IS NULL THEN
        RAISE NOTICE 'Nenhum usuário encontrado. Pulando criação de template.';
    ELSE
        -- Criar template de teste se não existir
        INSERT INTO public.templates (user_id, owner_id, nome, conteudo, canal, status)
        SELECT 
            first_user_id,
            first_user_id,
            'Template de Boas-vindas',
            '<h1>Olá!</h1><p>Este é um template de exemplo.</p><p>Você pode personalizar este template conforme suas necessidades.</p>',
            'email',
            'ativo'
        WHERE NOT EXISTS (
            SELECT 1 FROM public.templates 
            WHERE user_id = first_user_id 
            AND canal = 'email' 
            AND status = 'ativo'
        );
        
        RAISE NOTICE 'Template criado para usuário: %', first_user_id;
    END IF;
END $$;

-- 3. Verificar se o template foi criado
SELECT 
    id,
    nome,
    user_id,
    owner_id,
    canal,
    status,
    created_at
FROM public.templates
ORDER BY created_at DESC;

-- 4. Verificar se há templates com user_id null e corrigir
UPDATE public.templates 
SET user_id = (
    SELECT id FROM auth.users 
    ORDER BY created_at ASC 
    LIMIT 1
),
owner_id = (
    SELECT id FROM auth.users 
    ORDER BY created_at ASC 
    LIMIT 1
)
WHERE user_id IS NULL;

-- 5. Verificação final
SELECT 
    COUNT(*) as total_templates,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as templates_com_user_id,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as templates_sem_user_id
FROM public.templates;

-- 6. Listar todos os templates finais
SELECT 
    id,
    nome,
    user_id,
    canal,
    status,
    created_at
FROM public.templates
ORDER BY created_at DESC;