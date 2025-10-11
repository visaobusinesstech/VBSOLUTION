-- =====================================================
-- CRIAÇÃO DAS TABELAS FALTANDO NO SISTEMA
-- =====================================================
-- Execute este script no SQL Editor do Supabase para completar a sincronização
-- =====================================================

-- 1. CRIAR TABELA SUPPLIERS (Fornecedores)
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'Brasil',
  cnpj TEXT,
  contact_person TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  category TEXT,
  payment_terms TEXT,
  credit_limit DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. CRIAR TABELA WORK_GROUPS (Grupos de Trabalho)
CREATE TABLE IF NOT EXISTS public.work_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  leader_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  members JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_suppliers_owner_id ON public.suppliers(owner_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON public.suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_category ON public.suppliers(category);

CREATE INDEX IF NOT EXISTS idx_work_groups_owner_id ON public.work_groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_work_groups_leader_id ON public.work_groups(leader_id);
CREATE INDEX IF NOT EXISTS idx_work_groups_status ON public.work_groups(status);

-- 4. HABILITAR ROW LEVEL SECURITY
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_groups ENABLE ROW LEVEL SECURITY;

-- 5. CRIAR POLÍTICAS RLS PARA SUPPLIERS
DROP POLICY IF EXISTS "Usuários podem ver e editar apenas seus próprios fornecedores" ON public.suppliers;
CREATE POLICY "Usuários podem ver e editar apenas seus próprios fornecedores" ON public.suppliers
  FOR ALL USING (auth.uid() = owner_id);

-- 6. CRIAR POLÍTICAS RLS PARA WORK_GROUPS
DROP POLICY IF EXISTS "Usuários podem ver e editar apenas seus próprios grupos de trabalho" ON public.work_groups;
CREATE POLICY "Usuários podem ver e editar apenas seus próprios grupos de trabalho" ON public.work_groups
  FOR ALL USING (auth.uid() = owner_id);

-- 7. CRIAR TRIGGERS PARA ATUALIZAR updated_at
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_work_groups_updated_at
  BEFORE UPDATE ON public.work_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. CONCEDER PERMISSÕES
GRANT ALL ON public.suppliers TO authenticated;
GRANT ALL ON public.work_groups TO authenticated;

-- 9. VERIFICAR TABELAS CRIADAS
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('suppliers', 'work_groups')
ORDER BY table_name;

-- 10. VERIFICAR POLÍTICAS RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('suppliers', 'work_groups')
ORDER BY tablename, policyname;

-- =====================================================
-- COMENTÁRIOS IMPORTANTES
-- =====================================================
-- Este script cria as 2 tabelas que estavam faltando:
-- 1. suppliers → Para gerenciar fornecedores
-- 2. work_groups → Para gerenciar grupos de trabalho
-- =====================================================
-- Após executar este script, o sistema estará 100% sincronizado
-- =====================================================
