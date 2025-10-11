-- =====================================================
-- CORRIGIR PERMISSÕES DA TABELA WORK_GROUPS
-- =====================================================

-- 1. Primeiro, verificar se as colunas existem e adicionar as que faltam
ALTER TABLE public.work_groups 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS photo TEXT,
ADD COLUMN IF NOT EXISTS sector TEXT,
ADD COLUMN IF NOT EXISTS tasks_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_tasks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS active_projects INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- 2. Desabilitar RLS temporariamente para permitir inserções
ALTER TABLE public.work_groups DISABLE ROW LEVEL SECURITY;

-- 3. Criar política RLS permissiva para permitir que usuários vejam e criem seus próprios grupos
ALTER TABLE public.work_groups ENABLE ROW LEVEL SECURITY;

-- 4. Política para SELECT - usuários podem ver apenas seus próprios grupos
DROP POLICY IF EXISTS "Users can view their own work groups" ON public.work_groups;
CREATE POLICY "Users can view their own work groups" ON public.work_groups
    FOR SELECT USING (owner_id = auth.uid());

-- 5. Política para INSERT - usuários podem criar grupos (serão automaticamente owner_id)
DROP POLICY IF EXISTS "Users can create work groups" ON public.work_groups;
CREATE POLICY "Users can create work groups" ON public.work_groups
    FOR INSERT WITH CHECK (owner_id = auth.uid());

-- 6. Política para UPDATE - usuários podem atualizar apenas seus próprios grupos
DROP POLICY IF EXISTS "Users can update their own work groups" ON public.work_groups;
CREATE POLICY "Users can update their own work groups" ON public.work_groups
    FOR UPDATE USING (owner_id = auth.uid());

-- 7. Política para DELETE - usuários podem deletar apenas seus próprios grupos
DROP POLICY IF EXISTS "Users can delete their own work groups" ON public.work_groups;
CREATE POLICY "Users can delete their own work groups" ON public.work_groups
    FOR DELETE USING (owner_id = auth.uid());

-- 8. Verificar se a tabela work_group_members existe e tem as permissões corretas
CREATE TABLE IF NOT EXISTS public.work_group_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    work_group_id UUID NOT NULL REFERENCES public.work_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(work_group_id, user_id)
);

-- 9. Políticas para work_group_members
ALTER TABLE public.work_group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view work group members" ON public.work_group_members;
CREATE POLICY "Users can view work group members" ON public.work_group_members
    FOR SELECT USING (user_id = auth.uid() OR work_group_id IN (
        SELECT id FROM public.work_groups WHERE owner_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can insert work group members" ON public.work_group_members;
CREATE POLICY "Users can insert work group members" ON public.work_group_members
    FOR INSERT WITH CHECK (work_group_id IN (
        SELECT id FROM public.work_groups WHERE owner_id = auth.uid()
    ));

-- 10. Testar inserção de dados
INSERT INTO public.work_groups (name, description, owner_id, color, sector, status)
VALUES ('Grupo Teste Permissões', 'Teste de permissões', auth.uid(), '#3B82F6', 'Desenvolvimento', 'active')
ON CONFLICT DO NOTHING;

-- 11. Verificar dados inseridos
SELECT * FROM public.work_groups WHERE owner_id = auth.uid() ORDER BY created_at DESC LIMIT 5;
