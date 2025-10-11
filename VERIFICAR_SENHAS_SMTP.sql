-- Script para verificar se as senhas SMTP estão sendo salvas
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar senhas na tabela user_profiles
SELECT 
    id,
    email_usuario,
    smtp_host,
    email_porta,
    smtp_seguranca,
    CASE 
        WHEN smtp_pass IS NOT NULL AND smtp_pass != '' THEN '✅ Senha configurada'
        ELSE '❌ Senha não configurada'
    END as status_senha,
    LENGTH(smtp_pass) as tamanho_senha,
    created_at,
    updated_at
FROM public.user_profiles
WHERE smtp_host IS NOT NULL
ORDER BY updated_at DESC;

-- 2. Verificar senhas na tabela smtp_settings
SELECT 
    id,
    user_id,
    host,
    port,
    "user",
    CASE 
        WHEN pass IS NOT NULL AND pass != '' THEN '✅ Senha configurada'
        ELSE '❌ Senha não configurada'
    END as status_senha,
    LENGTH(pass) as tamanho_senha,
    from_name,
    security,
    is_active,
    created_at,
    updated_at
FROM public.smtp_settings
ORDER BY updated_at DESC;

-- 3. Comparar configurações entre as duas tabelas
SELECT 
    up.id as user_profile_id,
    up.email_usuario,
    up.smtp_host,
    up.email_porta,
    CASE 
        WHEN up.smtp_pass IS NOT NULL AND up.smtp_pass != '' THEN '✅'
        ELSE '❌'
    END as senha_user_profiles,
    ss.id as smtp_settings_id,
    ss."user" as smtp_user,
    ss.host as smtp_host,
    ss.port as smtp_port,
    CASE 
        WHEN ss.pass IS NOT NULL AND ss.pass != '' THEN '✅'
        ELSE '❌'
    END as senha_smtp_settings,
    CASE 
        WHEN ss.id IS NOT NULL THEN 'Sincronizado'
        ELSE 'Não sincronizado'
    END as status_sincronizacao
FROM public.user_profiles up
LEFT JOIN public.smtp_settings ss ON up.id = ss.user_id
WHERE up.smtp_host IS NOT NULL
ORDER BY up.updated_at DESC;

-- 4. Verificar se há usuários sem configuração SMTP
SELECT 
    COUNT(*) as total_usuarios,
    COUNT(smtp_host) as usuarios_com_host,
    COUNT(smtp_pass) as usuarios_com_senha,
    COUNT(CASE WHEN smtp_pass IS NOT NULL AND smtp_pass != '' THEN 1 END) as usuarios_com_senha_preenchida
FROM public.user_profiles;

-- 5. Verificar se há configurações SMTP órfãs
SELECT 
    ss.id,
    ss.user_id,
    ss.host,
    ss."user",
    CASE 
        WHEN up.id IS NULL THEN '❌ Usuário não encontrado'
        ELSE '✅ Usuário existe'
    END as status_usuario
FROM public.smtp_settings ss
LEFT JOIN public.user_profiles up ON ss.user_id = up.id;

-- 6. Estatísticas gerais
SELECT 
    'ESTATÍSTICAS SMTP' as titulo,
    (SELECT COUNT(*) FROM public.user_profiles WHERE smtp_host IS NOT NULL) as usuarios_com_smtp,
    (SELECT COUNT(*) FROM public.user_profiles WHERE smtp_pass IS NOT NULL AND smtp_pass != '') as usuarios_com_senha,
    (SELECT COUNT(*) FROM public.smtp_settings WHERE is_active = true) as configuracoes_ativas,
    (SELECT COUNT(*) FROM public.smtp_settings WHERE pass IS NOT NULL AND pass != '') as configuracoes_com_senha;


