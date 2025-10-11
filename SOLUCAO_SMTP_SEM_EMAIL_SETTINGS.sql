-- Script para configurar SMTP sem depender da tabela email_settings
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a tabela smtp_settings existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'smtp_settings' AND table_schema = 'public') 
        THEN '✅ Tabela smtp_settings existe'
        ELSE '❌ Tabela smtp_settings NÃO existe'
    END as status_tabela;

-- 2. Verificar configurações SMTP atuais em user_profiles
SELECT 
    'CONFIGURAÇÕES EM USER_PROFILES' as titulo,
    id,
    email_usuario,
    smtp_host,
    email_porta,
    CASE 
        WHEN smtp_pass IS NOT NULL AND smtp_pass != '' THEN '✅ Senha configurada'
        ELSE '❌ Sem senha'
    END as status_senha,
    smtp_from_name,
    smtp_seguranca,
    updated_at
FROM public.user_profiles
WHERE smtp_host IS NOT NULL
ORDER BY updated_at DESC;

-- 3. Migrar configurações de user_profiles para smtp_settings
INSERT INTO public.smtp_settings (
    user_id,
    host,
    port,
    "user",
    pass,
    from_name,
    security,
    is_active,
    created_at,
    updated_at
)
SELECT 
    id as user_id,
    smtp_host as host,
    COALESCE(email_porta, 587) as port,
    email_usuario as "user",
    smtp_pass as pass,
    COALESCE(smtp_from_name, 'Sistema') as from_name,
    COALESCE(smtp_seguranca, 'tls') as security,
    true as is_active,
    NOW() as created_at,
    NOW() as updated_at
FROM public.user_profiles
WHERE smtp_host IS NOT NULL 
AND email_usuario IS NOT NULL 
AND smtp_pass IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM public.smtp_settings ss 
    WHERE ss.user_id = user_profiles.id
);

-- 4. Verificar resultado da migração
SELECT 
    'RESULTADO DA MIGRAÇÃO' as titulo,
    (SELECT COUNT(*) FROM public.user_profiles WHERE smtp_host IS NOT NULL) as configuracoes_user_profiles,
    (SELECT COUNT(*) FROM public.smtp_settings) as configuracoes_smtp_settings,
    (SELECT COUNT(*) FROM public.smtp_settings WHERE is_active = true) as configuracoes_ativas;

-- 5. Verificar configurações migradas
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

-- 6. Verificar se há configurações duplicadas
SELECT 
    user_id,
    COUNT(*) as total_configuracoes
FROM public.smtp_settings
GROUP BY user_id
HAVING COUNT(*) > 1;

-- 7. Limpar configurações duplicadas (manter apenas a mais recente)
WITH ranked_configs AS (
    SELECT 
        id,
        user_id,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
    FROM public.smtp_settings
)
DELETE FROM public.smtp_settings
WHERE id IN (
    SELECT id FROM ranked_configs WHERE rn > 1
);

-- 8. Verificação final
SELECT 
    'VERIFICAÇÃO FINAL SMTP' as titulo,
    (SELECT COUNT(*) FROM public.user_profiles WHERE smtp_host IS NOT NULL) as usuarios_com_smtp,
    (SELECT COUNT(*) FROM public.user_profiles WHERE smtp_pass IS NOT NULL AND smtp_pass != '') as usuarios_com_senha,
    (SELECT COUNT(*) FROM public.smtp_settings WHERE is_active = true) as configuracoes_ativas,
    (SELECT COUNT(*) FROM public.smtp_settings WHERE pass IS NOT NULL AND pass != '') as configuracoes_com_senha;

-- 9. Mostrar configurações finais
SELECT 
    ss.id,
    ss.user_id,
    ss.host,
    ss.port,
    ss."user",
    CASE 
        WHEN ss.pass IS NOT NULL AND ss.pass != '' THEN '✅ Senha OK'
        ELSE '❌ Sem senha'
    END as status_senha,
    ss.from_name,
    ss.security,
    ss.is_active,
    ss.created_at
FROM public.smtp_settings ss
ORDER BY ss.created_at DESC;


