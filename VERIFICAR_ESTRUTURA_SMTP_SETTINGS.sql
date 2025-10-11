-- Script para verificar a estrutura da tabela smtp_settings
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar estrutura completa da tabela smtp_settings
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'smtp_settings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar se a coluna 'pass' existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'smtp_settings' 
            AND column_name = 'pass'
            AND table_schema = 'public'
        ) 
        THEN '✅ Coluna pass existe'
        ELSE '❌ Coluna pass NÃO existe'
    END as status_coluna_pass;

-- 3. Verificar todas as colunas disponíveis
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'stp_settings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Verificar dados atuais na tabela
SELECT 
    id,
    user_id,
    host,
    port,
    "user",
    from_name,
    security,
    is_active,
    created_at,
    updated_at
FROM public.smtp_settings
ORDER BY created_at DESC;


