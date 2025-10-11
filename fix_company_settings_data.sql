-- Script para corrigir dados em falta na tabela company_settings
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se existem dados na tabela company_settings
SELECT COUNT(*) as total_settings FROM public.company_settings;

-- 2. Verificar se existe company_id padrão
SELECT COUNT(*) as total_companies FROM public.companies WHERE id = '11111111-1111-1111-1111-111111111111';

-- 3. Criar empresa padrão se não existir
INSERT INTO public.companies (
    id,
    name,
    email,
    phone,
    address,
    city,
    state,
    zip_code,
    country,
    website,
    industry,
    size,
    status,
    created_at,
    updated_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Empresa Padrão',
    'contato@empresa.com',
    '(11) 99999-9999',
    'Rua Exemplo, 123',
    'São Paulo',
    'SP',
    '01234-567',
    'Brasil',
    'https://www.empresa.com',
    'Tecnologia',
    'Pequena',
    'active',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 4. Inserir configurações padrão se não existirem
INSERT INTO public.company_settings (
    id,
    company_id,
    company_name,
    default_language,
    default_timezone,
    default_currency,
    datetime_format,
    logo_url,
    primary_color,
    secondary_color,
    accent_color,
    enable_2fa,
    password_policy,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111',
    'Empresa Padrão',
    'pt-BR',
    'America/Sao_Paulo',
    'BRL',
    'DD/MM/YYYY HH:mm',
    NULL,
    '#021529',
    '#ffffff',
    '#3b82f6',
    false,
    '{"min_length": 8, "require_numbers": true, "require_uppercase": true, "require_special": true}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (company_id) DO NOTHING;

-- 5. Verificar se os dados foram inseridos corretamente
SELECT 
    cs.id,
    cs.company_id,
    cs.company_name,
    cs.logo_url,
    cs.primary_color,
    cs.secondary_color,
    cs.accent_color,
    cs.enable_2fa,
    cs.created_at
FROM public.company_settings cs
WHERE cs.company_id = '11111111-1111-1111-1111-111111111111';

-- 6. Verificar se há dados para outros company_ids
SELECT 
    company_id,
    COUNT(*) as settings_count
FROM public.company_settings
GROUP BY company_id;
