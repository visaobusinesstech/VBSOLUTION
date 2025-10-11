-- Script para migrar configurações SMTP de email_settings para smtp_settings
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar configurações existentes em email_settings
SELECT 
    'CONFIGURAÇÕES EM EMAIL_SETTINGS' as titulo,
    COUNT(*) as total_configuracoes
FROM public.email_settings;

-- 2. Verificar configurações existentes em smtp_settings
SELECT 
    'CONFIGURAÇÕES EM SMTP_SETTINGS' as titulo,
    COUNT(*) as total_configuracoes
FROM public.smtp_settings;

-- 3. Migrar configurações de email_settings para smtp_settings
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
    es.owner_id as user_id,
    es.smtp_host as host,
    COALESCE(es.smtp_port, 587) as port,
    es.email as "user",
    es.password as pass,
    'Sistema' as from_name,
    CASE 
        WHEN es.use_tls = true THEN 'tls'
        ELSE 'ssl'
    END as security,
    true as is_active,
    NOW() as created_at,
    NOW() as updated_at
FROM public.email_settings es
WHERE es.smtp_host IS NOT NULL 
AND es.email IS NOT NULL 
AND es.password IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM public.smtp_settings ss 
    WHERE ss.user_id = es.owner_id
);

-- 4. Verificar resultado da migração
SELECT 
    'RESULTADO DA MIGRAÇÃO' as titulo,
    (SELECT COUNT(*) FROM public.email_settings WHERE smtp_host IS NOT NULL) as configuracoes_originais,
    (SELECT COUNT(*) FROM public.smtp_settings) as configuracoes_migradas,
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
    'VERIFICAÇÃO FINAL' as titulo,
    COUNT(*) as configuracoes_finais,
    COUNT(DISTINCT user_id) as usuarios_unicos,
    COUNT(CASE WHEN pass IS NOT NULL AND pass != '' THEN 1 END) as configuracoes_com_senha
FROM public.smtp_settings;


