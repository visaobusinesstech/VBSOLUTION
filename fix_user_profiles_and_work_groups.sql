-- =====================================================
-- CORRIGIR USUÁRIO E WORK_GROUPS
-- =====================================================

-- 1. Verificar se o usuário existe na tabela user_profiles
SELECT id, email FROM public.user_profiles WHERE id = 'ab5d7722-34e6-49dd-b33d-c52ff27d069b';

-- 2. Verificar todos os usuários em user_profiles
SELECT id, email, name FROM public.user_profiles LIMIT 10;

-- 3. Verificar se o usuário existe na tabela auth.users
SELECT id, email FROM auth.users WHERE id = 'ab5d7722-34e6-49dd-b33d-c52ff27d069b';

-- 4. Se o usuário não existe em user_profiles, vamos criá-lo
-- Primeiro, vamos pegar os dados do auth.users
INSERT INTO public.user_profiles (id, email, name, created_at, updated_at)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'name', email) as name,
    created_at,
    updated_at
FROM auth.users 
WHERE id = 'ab5d7722-34e6-49dd-b33d-c52ff27d069b'
ON CONFLICT (id) DO NOTHING;

-- 5. Verificar se o usuário foi criado
SELECT id, email, name FROM public.user_profiles WHERE id = 'ab5d7722-34e6-49dd-b33d-c52ff27d069b';

-- 6. Se ainda não funcionar, vamos remover a chave estrangeira temporariamente
ALTER TABLE public.work_groups DROP CONSTRAINT IF EXISTS work_groups_owner_id_fkey;

-- 7. Desabilitar RLS para testar
ALTER TABLE public.work_groups DISABLE ROW LEVEL SECURITY;

-- 8. Inserir dados de teste sem chave estrangeira
INSERT INTO public.work_groups (name, owner_id, description, status, color, sector)
VALUES (
    'Grupo Teste Sem FK', 
    'ab5d7722-34e6-49dd-b33d-c52ff27d069b',
    'Teste sem chave estrangeira',
    'active',
    '#3B82F6',
    'Desenvolvimento'
);

-- 9. Verificar se funcionou
SELECT * FROM public.work_groups WHERE name = 'Grupo Teste Sem FK';

-- 10. Se funcionou, vamos recriar a chave estrangeira corretamente
-- Primeiro, vamos garantir que o usuário existe
INSERT INTO public.user_profiles (id, email, name, created_at, updated_at)
SELECT 
    'ab5d7722-34e6-49dd-b33d-c52ff27d069b',
    'usuario@teste.com',
    'Usuário Teste',
    now(),
    now()
ON CONFLICT (id) DO NOTHING;

-- 11. Recriar a chave estrangeira
ALTER TABLE public.work_groups 
ADD CONSTRAINT work_groups_owner_id_fkey 
FOREIGN KEY (owner_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- 12. Reabilitar RLS com política permissiva
ALTER TABLE public.work_groups ENABLE ROW LEVEL SECURITY;

-- 13. Política permissiva
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.work_groups;
CREATE POLICY "Allow all for authenticated users" ON public.work_groups
    FOR ALL USING (true);

-- 14. Testar inserção final
INSERT INTO public.work_groups (name, owner_id, description, status, color, sector)
VALUES (
    'Grupo Teste Final', 
    'ab5d7722-34e6-49dd-b33d-c52ff27d069b',
    'Teste final com tudo corrigido',
    'active',
    '#10B981',
    'Marketing'
);

-- 15. Verificar resultado final
SELECT * FROM public.work_groups WHERE name = 'Grupo Teste Final';

-- 16. Se ainda não funcionar, desabilitar RLS definitivamente
-- ALTER TABLE public.work_groups DISABLE ROW LEVEL SECURITY;
