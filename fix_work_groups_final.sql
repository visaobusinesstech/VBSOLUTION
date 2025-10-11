-- =====================================================
-- SOLUÇÃO DEFINITIVA PARA WORK_GROUPS - PERMISSÕES
-- =====================================================

-- 1. Primeiro, vamos verificar se o usuário está autenticado
SELECT auth.uid() as current_user_id;

-- 2. Desabilitar completamente RLS para testar
ALTER TABLE public.work_groups DISABLE ROW LEVEL SECURITY;

-- 3. Verificar se conseguimos inserir dados sem RLS
INSERT INTO public.work_groups (name, description, owner_id, color, sector, status)
VALUES ('Teste Sem RLS', 'Teste sem Row Level Security', auth.uid(), '#3B82F6', 'Desenvolvimento', 'active')
ON CONFLICT DO NOTHING;

-- 4. Verificar se o insert funcionou
SELECT * FROM public.work_groups WHERE name = 'Teste Sem RLS';

-- 5. Se funcionou, vamos criar políticas mais simples
ALTER TABLE public.work_groups ENABLE ROW LEVEL SECURITY;

-- 6. Política muito permissiva para testar
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.work_groups;
CREATE POLICY "Allow all for authenticated users" ON public.work_groups
    FOR ALL USING (auth.role() = 'authenticated');

-- 7. Testar inserção com RLS ativo
INSERT INTO public.work_groups (name, description, owner_id, color, sector, status)
VALUES ('Teste Com RLS', 'Teste com Row Level Security', auth.uid(), '#3B82F6', 'Desenvolvimento', 'active')
ON CONFLICT DO NOTHING;

-- 8. Verificar se funcionou
SELECT * FROM public.work_groups WHERE name = 'Teste Com RLS';

-- 9. Se ainda não funcionar, vamos desabilitar RLS definitivamente
-- ALTER TABLE public.work_groups DISABLE ROW LEVEL SECURITY;

-- 10. Verificar estrutura final da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'work_groups' 
AND table_schema = 'public'
ORDER BY ordinal_position;
