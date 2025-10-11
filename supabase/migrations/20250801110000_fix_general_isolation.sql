-- Migração para corrigir o isolamento de dados em todas as tabelas do sistema
-- Data: 2025-08-01
-- Problema: Muitas tabelas têm políticas que permitem acesso total (FOR ALL USING (true))
-- Solução: Implementar políticas que isolam os dados por usuário e empresa

-- =====================================================
-- CORRIGIR POLÍTICAS DE FUNCIONÁRIOS
-- =====================================================

-- Remover política permissiva
DROP POLICY IF EXISTS "Allow all access to employees" ON public.employees;

-- Criar políticas corretas para employees
CREATE POLICY "Users can view employees of their company" ON public.employees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = employees.company_id
        )
    );

CREATE POLICY "Users can create employees in their company" ON public.employees
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = employees.company_id
        )
    );

CREATE POLICY "Users can update employees in their company" ON public.employees
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = employees.company_id
        )
    );

CREATE POLICY "Users can delete employees in their company" ON public.employees
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = employees.company_id
        )
    );

-- =====================================================
-- CORRIGIR POLÍTICAS DE FORNECEDORES
-- =====================================================

-- Remover política permissiva
DROP POLICY IF EXISTS "Allow all access to suppliers" ON public.suppliers;

-- Criar políticas corretas para suppliers
CREATE POLICY "Users can view suppliers of their company" ON public.suppliers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = suppliers.company_id
        )
    );

CREATE POLICY "Users can create suppliers in their company" ON public.suppliers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = suppliers.company_id
        )
    );

CREATE POLICY "Users can update suppliers in their company" ON public.suppliers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = suppliers.company_id
        )
    );

CREATE POLICY "Users can delete suppliers in their company" ON public.suppliers
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = suppliers.company_id
        )
    );

-- =====================================================
-- CORRIGIR POLÍTICAS DE INVENTÁRIO
-- =====================================================

-- Remover política permissiva
DROP POLICY IF EXISTS "Allow all access to inventory" ON public.inventory;

-- Criar políticas corretas para inventory
CREATE POLICY "Users can view inventory of their company" ON public.inventory
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = inventory.company_id
        )
    );

CREATE POLICY "Users can create inventory items in their company" ON public.inventory
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = inventory.company_id
        )
    );

CREATE POLICY "Users can update inventory items in their company" ON public.inventory
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = inventory.company_id
        )
    );

CREATE POLICY "Users can delete inventory items in their company" ON public.inventory
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = inventory.company_id
        )
    );

-- =====================================================
-- CORRIGIR POLÍTICAS DE LEADS
-- =====================================================

-- Remover política permissiva
DROP POLICY IF EXISTS "Allow all access to leads" ON public.leads;

-- Criar políticas corretas para leads
CREATE POLICY "Users can view leads of their company" ON public.leads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = leads.company_id
        )
    );

CREATE POLICY "Users can create leads in their company" ON public.leads
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = leads.company_id
        )
    );

CREATE POLICY "Users can update leads in their company" ON public.leads
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = leads.company_id
        )
    );

CREATE POLICY "Users can delete leads in their company" ON public.leads
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = leads.company_id
        )
    );

-- =====================================================
-- CORRIGIR POLÍTICAS DE PROJETOS
-- =====================================================

-- Remover política permissiva
DROP POLICY IF EXISTS "Allow all access to projects" ON public.projects;

-- Criar políticas corretas para projects
CREATE POLICY "Users can view projects of their company" ON public.projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = projects.company_id
        )
    );

CREATE POLICY "Users can create projects in their company" ON public.projects
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = projects.company_id
        )
    );

CREATE POLICY "Users can update projects in their company" ON public.projects
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = projects.company_id
        )
    );

CREATE POLICY "Users can delete projects in their company" ON public.projects
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = projects.company_id
        )
    );

-- =====================================================
-- CORRIGIR POLÍTICAS DE GRUPOS DE TRABALHO
-- =====================================================

-- Remover política permissiva
DROP POLICY IF EXISTS "Allow all access to work_groups" ON public.work_groups;

-- Criar políticas corretas para work_groups
CREATE POLICY "Users can view work groups of their company" ON public.work_groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = work_groups.company_id
        )
    );

CREATE POLICY "Users can create work groups in their company" ON public.work_groups
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = work_groups.company_id
        )
    );

CREATE POLICY "Users can update work groups in their company" ON public.work_groups
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = work_groups.company_id
        )
    );

CREATE POLICY "Users can delete work groups in their company" ON public.work_groups
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = work_groups.company_id
        )
    );

-- =====================================================
-- CORRIGIR POLÍTICAS DE ARQUIVOS
-- =====================================================

-- Remover política permissiva
DROP POLICY IF EXISTS "Allow all access to files" ON public.files;

-- Criar políticas corretas para files
CREATE POLICY "Users can view files of their company" ON public.files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = files.company_id
        )
    );

CREATE POLICY "Users can create files in their company" ON public.files
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = files.company_id
        )
    );

CREATE POLICY "Users can update files in their company" ON public.files
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = files.company_id
        )
    );

CREATE POLICY "Users can delete files in their company" ON public.files
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = files.company_id
        )
    );

-- =====================================================
-- CORRIGIR POLÍTICAS DE CONFIGURAÇÕES DA EMPRESA
-- =====================================================

-- Remover política permissiva
DROP POLICY IF EXISTS "Allow all access to company_settings" ON public.company_settings;

-- Criar políticas corretas para company_settings
CREATE POLICY "Users can view settings of their company" ON public.company_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = company_settings.company_id
        )
    );

CREATE POLICY "Users can update settings of their company" ON public.company_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.company_id = company_settings.company_id
        )
    );

-- =====================================================
-- ADICIONAR COMENTÁRIOS EXPLICATIVOS
-- =====================================================

COMMENT ON POLICY "Users can view employees of their company" ON public.employees IS 
'Política que garante que usuários só vejam funcionários da mesma empresa';

COMMENT ON POLICY "Users can view suppliers of their company" ON public.suppliers IS 
'Política que garante que usuários só vejam fornecedores da mesma empresa';

COMMENT ON POLICY "Users can view inventory of their company" ON public.inventory IS 
'Política que garante que usuários só vejam inventário da mesma empresa';

COMMENT ON POLICY "Users can view leads of their company" ON public.leads IS 
'Política que garante que usuários só vejam leads da mesma empresa';

COMMENT ON POLICY "Users can view projects of their company" ON public.projects IS 
'Política que garante que usuários só vejam projetos da mesma empresa';

COMMENT ON POLICY "Users can view work groups of their company" ON public.work_groups IS 
'Política que garante que usuários só vejam grupos de trabalho da mesma empresa';

COMMENT ON POLICY "Users can view files of their company" ON public.files IS 
'Política que garante que usuários só vejam arquivos da mesma empresa';

COMMENT ON POLICY "Users can view settings of their company" ON public.company_settings IS 
'Política que garante que usuários só vejam configurações da mesma empresa';

-- =====================================================
-- VERIFICAR SE AS POLÍTICAS FORAM APLICADAS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Verificando políticas aplicadas...';
    
    -- Listar todas as políticas das tabelas principais
    FOR policy_info IN 
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
        FROM pg_policies 
        WHERE tablename IN ('employees', 'suppliers', 'inventory', 'leads', 'projects', 'work_groups', 'files', 'company_settings')
        ORDER BY tablename, cmd
    LOOP
        RAISE NOTICE 'Tabela: % - Política: % - Comando: %', 
            policy_info.tablename, 
            policy_info.policyname, 
            policy_info.cmd;
    END LOOP;
END $$;
