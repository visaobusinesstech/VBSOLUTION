-- Migração para corrigir o isolamento de dados das atividades por usuário
-- Data: 2025-08-01
-- Problema: A política atual permite que todos os usuários vejam todas as atividades
-- Solução: Implementar políticas que isolam os dados por usuário

-- 1. Remover a política problemática que permite visualizar todas as atividades
DROP POLICY IF EXISTS "Users can view all activities" ON public.activities;

-- 2. Criar políticas corretas que isolam os dados por usuário

-- Política para visualização: usuários só podem ver atividades que criaram ou foram designados
CREATE POLICY "Users can view own activities or assigned to them" ON public.activities
    FOR SELECT USING (
        auth.uid() = created_by OR 
        auth.uid() = assigned_to OR
        -- Permitir que usuários vejam atividades da mesma empresa (se company_id estiver definido)
        (company_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = activities.company_id
        ))
    );

-- Política para criação: usuários só podem criar atividades para si ou para outros da mesma empresa
CREATE POLICY "Users can create activities for themselves or company members" ON public.activities
    FOR INSERT WITH CHECK (
        auth.uid() = created_by AND (
            -- Pode criar para si mesmo
            assigned_to = auth.uid() OR
            -- Ou para outros da mesma empresa
            (company_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.user_profiles up 
                WHERE up.id = assigned_to 
                AND up.company_id = activities.company_id
            ))
        )
    );

-- Política para atualização: usuários só podem atualizar atividades que criaram ou foram designados
CREATE POLICY "Users can update own activities or assigned to them" ON public.activities
    FOR UPDATE USING (
        auth.uid() = created_by OR 
        auth.uid() = assigned_to
    );

-- Política para exclusão: usuários só podem excluir atividades que criaram
CREATE POLICY "Users can delete activities they created" ON public.activities
    FOR DELETE USING (
        auth.uid() = created_by
    );

-- 3. Aplicar as mesmas políticas para as tabelas relacionadas

-- Política para activity_comments
DROP POLICY IF EXISTS "Users can view comments of activities they have access to" ON activity_comments;
CREATE POLICY "Users can view comments of activities they have access to" ON activity_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM activities a 
            WHERE a.id = activity_comments.activity_id 
            AND (
                a.created_by = auth.uid() OR 
                a.assigned_to = auth.uid() OR
                (a.company_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM public.user_profiles up 
                    WHERE up.id = auth.uid() 
                    AND up.company_id = a.company_id
                ))
            )
        )
    );

-- Política para activity_attachments
DROP POLICY IF EXISTS "Users can view attachments of activities they have access to" ON activity_attachments;
CREATE POLICY "Users can view attachments of activities they have access to" ON activity_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM activities a 
            WHERE a.id = activity_attachments.activity_id 
            AND (
                a.created_by = auth.uid() OR 
                a.assigned_to = auth.uid() OR
                (a.company_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM public.user_profiles up 
                    WHERE up.id = auth.uid() 
                    AND up.company_id = a.company_id
                ))
            )
        )
    );

-- Política para activity_history
DROP POLICY IF EXISTS "Users can view history of activities they have access to" ON activity_history;
CREATE POLICY "Users can view history of activities they have access to" ON activity_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM activities a 
            WHERE a.id = activity_history.activity_id 
            AND (
                a.created_by = auth.uid() OR 
                a.assigned_to = auth.uid() OR
                (a.company_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM public.user_profiles up 
                    WHERE up.id = auth.uid() 
                    AND up.company_id = a.company_id
                ))
            )
        )
    );

-- 4. Adicionar comentários explicativos
COMMENT ON POLICY "Users can view own activities or assigned to them" ON public.activities IS 
'Política que garante que usuários só vejam atividades próprias, designadas para eles ou da mesma empresa';

COMMENT ON POLICY "Users can create activities for themselves or company members" ON public.activities IS 
'Política que permite criar atividades para si mesmo ou para membros da mesma empresa';

COMMENT ON POLICY "Users can update own activities or assigned to them" ON public.activities IS 
'Política que permite atualizar apenas atividades próprias ou designadas para o usuário';

COMMENT ON POLICY "Users can delete activities they created" ON public.activities IS 
'Política que permite excluir apenas atividades criadas pelo usuário';

-- 5. Verificar se as políticas foram aplicadas corretamente
DO $$
BEGIN
    RAISE NOTICE 'Verificando políticas da tabela activities...';
    
    -- Listar políticas existentes
    FOR policy_info IN 
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies 
        WHERE tablename = 'activities'
    LOOP
        RAISE NOTICE 'Política: % - Comando: % - Condição: %', 
            policy_info.policyname, 
            policy_info.cmd, 
            policy_info.qual;
    END LOOP;
END $$;
