-- =====================================================
-- VERIFICAR DADOS DOS GRUPOS DE TRABALHO
-- =====================================================

-- 1. Verificar todos os grupos de trabalho
SELECT 
    id,
    name,
    description,
    owner_id,
    status,
    color,
    sector,
    created_at,
    updated_at
FROM public.work_groups 
ORDER BY created_at DESC;

-- 2. Verificar grupos do usuário específico
SELECT 
    id,
    name,
    description,
    owner_id,
    status,
    color,
    sector,
    created_at
FROM public.work_groups 
WHERE owner_id = 'ab5d7722-34e6-49dd-b33d-c52ff27d069b'
ORDER BY created_at DESC;

-- 3. Verificar se o usuário existe em user_profiles
SELECT 
    id,
    email,
    name,
    created_at
FROM public.user_profiles 
WHERE id = 'ab5d7722-34e6-49dd-b33d-c52ff27d069b';

-- 4. Contar total de grupos
SELECT COUNT(*) as total_groups FROM public.work_groups;

-- 5. Contar grupos do usuário
SELECT COUNT(*) as user_groups 
FROM public.work_groups 
WHERE owner_id = 'ab5d7722-34e6-49dd-b33d-c52ff27d069b';

-- 6. Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'work_groups' 
AND table_schema = 'public'
ORDER BY ordinal_position;
