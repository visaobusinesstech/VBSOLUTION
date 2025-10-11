-- Script para adicionar a coluna 'pass' na tabela smtp_settings
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a coluna 'pass' existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'smtp_settings' 
            AND column_name = 'pass'
            AND table_schema = 'public'
        ) 
        THEN '✅ Coluna pass já existe'
        ELSE '❌ Coluna pass NÃO existe - precisa ser criada'
    END as status_coluna_pass;

-- 2. Adicionar coluna 'pass' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'smtp_settings' 
        AND column_name = 'pass'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.smtp_settings 
        ADD COLUMN pass TEXT;
        
        RAISE NOTICE 'Coluna pass adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna pass já existe';
    END IF;
END $$;

-- 3. Verificar se a coluna foi criada
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'smtp_settings' 
            AND column_name = 'pass'
            AND table_schema = 'public'
        ) 
        THEN '✅ Coluna pass criada com sucesso'
        ELSE '❌ Erro ao criar coluna pass'
    END as resultado;

-- 4. Migrar senhas de user_profiles para smtp_settings
UPDATE public.smtp_settings 
SET pass = (
    SELECT smtp_pass 
    FROM public.user_profiles 
    WHERE user_profiles.id = smtp_settings.user_id
)
WHERE pass IS NULL 
AND EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_profiles.id = smtp_settings.user_id 
    AND user_profiles.smtp_pass IS NOT NULL 
    AND user_profiles.smtp_pass != ''
);

-- 5. Verificar resultado da migração
SELECT 
    id,
    user_id,
    host,
    port,
    "user",
    CASE 
        WHEN pass IS NOT NULL AND pass != '' THEN '✅ Senha configurada'
        ELSE '❌ Sem senha'
    END as status_senha,
    from_name,
    security,
    is_active,
    created_at
FROM public.smtp_settings
ORDER BY created_at DESC;

-- 6. Verificar quantas configurações têm senha
SELECT 
    'ESTATÍSTICAS FINAIS' as titulo,
    COUNT(*) as total_configuracoes,
    COUNT(CASE WHEN pass IS NOT NULL AND pass != '' THEN 1 END) as configuracoes_com_senha,
    COUNT(CASE WHEN pass IS NULL OR pass = '' THEN 1 END) as configuracoes_sem_senha
FROM public.smtp_settings;


