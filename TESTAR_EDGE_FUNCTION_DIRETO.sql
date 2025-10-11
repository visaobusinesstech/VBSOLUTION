-- Script para testar e diagnosticar a edge function
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a edge function está deployada
-- (Execute manualmente no Supabase Dashboard → Edge Functions)

-- 2. Verificar configurações SMTP atuais
SELECT 
    'CONFIGURAÇÕES SMTP ATUAIS' as titulo,
    id,
    user_id,
    host,
    port,
    "user",
    CASE 
        WHEN pass IS NOT NULL AND pass != '' THEN '✅ Senha OK'
        ELSE '❌ Sem senha'
    END as status_senha,
    from_name,
    security,
    is_active,
    created_at
FROM public.smtp_settings
ORDER BY created_at DESC;

-- 3. Verificar se há configurações SMTP para o usuário atual
SELECT 
    'CONFIGURAÇÕES DO USUÁRIO ATUAL' as titulo,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.smtp_settings 
            WHERE user_id = auth.uid()
        ) 
        THEN '✅ Usuário tem configurações SMTP'
        ELSE '❌ Usuário NÃO tem configurações SMTP'
    END as status_usuario;

-- 4. Verificar detalhes das configurações do usuário atual
SELECT 
    id,
    host,
    port,
    "user",
    CASE 
        WHEN pass IS NOT NULL AND pass != '' THEN '✅ Senha configurada'
        ELSE '❌ Sem senha'
    END as status_senha,
    from_name,
    security,
    is_active
FROM public.smtp_settings
WHERE user_id = auth.uid();

-- 5. Verificar se há logs de email
SELECT 
    'LOGS DE EMAIL' as titulo,
    COUNT(*) as total_logs,
    COUNT(CASE WHEN status = 'sent' THEN 1 END) as emails_enviados,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as emails_falharam
FROM public.email_logs
WHERE user_id = auth.uid();

-- 6. Verificar logs recentes de email
SELECT 
    to_email,
    subject,
    status,
    sent_at,
    error_message
FROM public.email_logs
WHERE user_id = auth.uid()
ORDER BY sent_at DESC
LIMIT 5;

-- 7. Verificar se a tabela email_logs existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'email_logs' 
            AND table_schema = 'public'
        ) 
        THEN '✅ Tabela email_logs existe'
        ELSE '❌ Tabela email_logs NÃO existe'
    END as status_tabela_logs;

-- 8. Estatísticas gerais
SELECT 
    'ESTATÍSTICAS GERAIS' as titulo,
    (SELECT COUNT(*) FROM public.smtp_settings) as total_configuracoes,
    (SELECT COUNT(*) FROM public.smtp_settings WHERE is_active = true) as configuracoes_ativas,
    (SELECT COUNT(*) FROM public.smtp_settings WHERE pass IS NOT NULL AND pass != '') as configuracoes_com_senha,
    (SELECT COUNT(DISTINCT user_id) FROM public.smtp_settings) as usuarios_configurados;


