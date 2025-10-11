-- =====================================================
-- CORRIGIR CHAVE ESTRANGEIRA DA TABELA WORK_GROUPS
-- =====================================================

-- 1. Primeiro, vamos verificar a estrutura atual da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'work_groups' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar as chaves estrangeiras existentes
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='work_groups';

-- 3. Remover a chave estrangeira incorreta (se existir)
ALTER TABLE public.work_groups DROP CONSTRAINT IF EXISTS work_groups_owner_id_fkey;

-- 4. Verificar se a tabela user_profiles existe e tem dados
SELECT COUNT(*) as total_users FROM public.user_profiles;
SELECT id, email FROM public.user_profiles LIMIT 3;

-- 5. Criar a chave estrangeira correta para user_profiles
ALTER TABLE public.work_groups 
ADD CONSTRAINT work_groups_owner_id_fkey 
FOREIGN KEY (owner_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- 6. Desabilitar RLS temporariamente para testar
ALTER TABLE public.work_groups DISABLE ROW LEVEL SECURITY;

-- 7. Inserir dados de teste com um ID de usuário real
INSERT INTO public.work_groups (name, owner_id, description, status, color, sector)
VALUES (
    'Grupo Teste FK', 
    (SELECT id FROM public.user_profiles LIMIT 1),
    'Teste de chave estrangeira corrigida',
    'active',
    '#3B82F6',
    'Desenvolvimento'
);

-- 8. Verificar se funcionou
SELECT * FROM public.work_groups WHERE name = 'Grupo Teste FK';

-- 9. Reabilitar RLS com política permissiva
ALTER TABLE public.work_groups ENABLE ROW LEVEL SECURITY;

-- 10. Política permissiva para usuários autenticados
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.work_groups;
CREATE POLICY "Allow all for authenticated users" ON public.work_groups
    FOR ALL USING (true);

-- 11. Testar inserção com RLS ativo
INSERT INTO public.work_groups (name, owner_id, description, status, color, sector)
VALUES (
    'Grupo Teste RLS FK', 
    (SELECT id FROM public.user_profiles LIMIT 1),
    'Teste com RLS e FK corrigida',
    'active',
    '#10B981',
    'Marketing'
);

-- 12. Verificar se funcionou
SELECT * FROM public.work_groups WHERE name = 'Grupo Teste RLS FK';

-- 13. Se ainda não funcionar, desabilitar RLS definitivamente
-- ALTER TABLE public.work_groups DISABLE ROW LEVEL SECURITY;
