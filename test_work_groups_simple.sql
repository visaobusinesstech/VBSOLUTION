-- =====================================================
-- TESTE SIMPLES DOS GRUPOS DE TRABALHO
-- =====================================================

-- 1. Verificar todos os grupos
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
ORDER BY created_at DESC;

-- 2. Inserir um grupo de teste
INSERT INTO public.work_groups (name, description, owner_id, status, color, sector)
VALUES (
    'Grupo Teste Frontend', 
    'Teste para verificar se aparece na página',
    'ab5d7722-34e6-49dd-b33d-c52ff27d069b',
    'active',
    '#3B82F6',
    'Desenvolvimento'
);

-- 3. Verificar se foi inserido
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
WHERE name = 'Grupo Teste Frontend';
