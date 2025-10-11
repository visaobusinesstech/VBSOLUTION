-- Script para verificar se a implementação SMTP real está funcionando
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a tabela smtp_settings existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'smtp_settings' AND table_schema = 'public') 
        THEN '✅ Tabela smtp_settings existe'
        ELSE '❌ Tabela smtp_settings NÃO existe'
    END as status_tabela;

-- 2. Verificar estrutura da tabela smtp_settings
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'smtp_settings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar se há políticas RLS na tabela smtp_settings
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
WHERE tablename = 'smtp_settings';

-- 4. Verificar configurações SMTP existentes
SELECT 
    id,
    user_id,
    host,
    port,
    "user",
    from_name,
    security,
    is_active,
    created_at
FROM public.smtp_settings
ORDER BY created_at DESC;

-- 5. Verificar se há configurações em user_profiles que não foram migradas
SELECT 
    id,
    smtp_host,
    email_porta,
    email_usuario,
    smtp_from_name,
    smtp_seguranca
FROM public.user_profiles
WHERE smtp_host IS NOT NULL 
AND email_usuario IS NOT NULL 
AND smtp_pass IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM public.smtp_settings 
    WHERE smtp_settings.user_id = user_profiles.id
);

-- 6. Verificar se a tabela email_logs existe (para logs de envio)
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_logs' AND table_schema = 'public') 
        THEN '✅ Tabela email_logs existe'
        ELSE '⚠️ Tabela email_logs NÃO existe (será criada automaticamente)'
    END as status_email_logs;

-- 7. Verificar triggers na tabela smtp_settings
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'smtp_settings';

-- 8. Contar total de configurações SMTP por usuário
SELECT 
    COUNT(*) as total_configuracoes,
    COUNT(DISTINCT user_id) as usuarios_com_config
FROM public.smtp_settings
WHERE is_active = true;

-- 9. Verificar índices na tabela smtp_settings
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'smtp_settings' 
AND schemaname = 'public';

-- 10. Resumo final
SELECT 
    'RESUMO DA IMPLEMENTAÇÃO SMTP REAL' as titulo,
    (SELECT COUNT(*) FROM public.smtp_settings) as configuracoes_ativas,
    (SELECT COUNT(DISTINCT user_id) FROM public.smtp_settings WHERE is_active = true) as usuarios_configurados,
    (SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'smtp_settings' AND table_schema = 'public') THEN 'SIM' ELSE 'NÃO' END) as tabela_criada,
    (SELECT CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'smtp_settings') THEN 'SIM' ELSE 'NÃO' END) as rls_habilitado;


