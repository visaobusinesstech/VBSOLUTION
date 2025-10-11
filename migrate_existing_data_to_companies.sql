-- =====================================================
-- SCRIPT PARA MIGRAR DADOS EXISTENTES PARA EMPRESAS
-- =====================================================
-- Este script migra dados existentes para o sistema de isolamento por empresa
-- =====================================================

-- =====================================================
-- 1. CRIAR EMPRESAS PARA USUÁRIOS EXISTENTES SEM EMPRESA
-- =====================================================

-- Criar empresas para usuários que não têm empresa associada
INSERT INTO public.companies (
  owner_id,
  fantasy_name,
  company_name,
  email,
  status,
  created_at,
  updated_at
)
SELECT 
  p.id as owner_id,
  COALESCE(p.company, 'Empresa ' || p.email) as fantasy_name,
  COALESCE(p.company, 'Empresa ' || p.email) as company_name,
  p.email,
  'active' as status,
  p.created_at,
  p.updated_at
FROM public.profiles p
WHERE p.id NOT IN (
  SELECT DISTINCT owner_id FROM public.companies WHERE owner_id IS NOT NULL
)
AND p.id IS NOT NULL;

-- =====================================================
-- 2. ATUALIZAR PROFILES COM COMPANY_ID
-- =====================================================

-- Atualizar profiles com o company_id da empresa criada
UPDATE public.profiles 
SET company_id = c.id
FROM public.companies c
WHERE public.profiles.id = c.owner_id
AND public.profiles.company_id IS NULL;

-- =====================================================
-- 3. ATUALIZAR DADOS EXISTENTES COM COMPANY_ID
-- =====================================================

-- Atualizar employees com company_id
UPDATE public.employees 
SET company_id = p.company_id
FROM public.profiles p
WHERE public.employees.owner_id = p.id
AND public.employees.company_id IS NULL;

-- Atualizar products com company_id
UPDATE public.products 
SET company_id = p.company_id
FROM public.profiles p
WHERE public.products.owner_id = p.id
AND public.products.company_id IS NULL;

-- Atualizar inventory com company_id (via products)
UPDATE public.inventory 
SET company_id = pr.company_id
FROM public.products pr
WHERE public.inventory.product_id = pr.id
AND public.inventory.company_id IS NULL;

-- Atualizar funnel_stages com company_id
UPDATE public.funnel_stages 
SET company_id = p.company_id
FROM public.profiles p
WHERE public.funnel_stages.owner_id = p.id
AND public.funnel_stages.company_id IS NULL;

-- Atualizar leads com company_id
UPDATE public.leads 
SET company_id = p.company_id
FROM public.profiles p
WHERE public.leads.owner_id = p.id
AND public.leads.company_id IS NULL;

-- Atualizar deals com company_id
UPDATE public.deals 
SET company_id = p.company_id
FROM public.profiles p
WHERE public.deals.owner_id = p.id
AND public.deals.company_id IS NULL;

-- Atualizar activities com company_id
UPDATE public.activities 
SET company_id = p.company_id
FROM public.profiles p
WHERE public.activities.owner_id = p.id
AND public.activities.company_id IS NULL;

-- Atualizar projects com company_id
UPDATE public.projects 
SET company_id = p.company_id
FROM public.profiles p
WHERE public.projects.owner_id = p.id
AND public.projects.company_id IS NULL;

-- Atualizar whatsapp_atendimentos com company_id
UPDATE public.whatsapp_atendimentos 
SET company_id = p.company_id
FROM public.profiles p
WHERE public.whatsapp_atendimentos.owner_id = p.id
AND public.whatsapp_atendimentos.company_id IS NULL;

-- =====================================================
-- 4. VERIFICAÇÕES E LIMPEZA
-- =====================================================

-- Verificar se há dados sem company_id
SELECT 'profiles sem company_id' as tabela, COUNT(*) as quantidade
FROM public.profiles WHERE company_id IS NULL
UNION ALL
SELECT 'employees sem company_id', COUNT(*)
FROM public.employees WHERE company_id IS NULL
UNION ALL
SELECT 'products sem company_id', COUNT(*)
FROM public.products WHERE company_id IS NULL
UNION ALL
SELECT 'leads sem company_id', COUNT(*)
FROM public.leads WHERE company_id IS NULL
UNION ALL
SELECT 'deals sem company_id', COUNT(*)
FROM public.deals WHERE company_id IS NULL
UNION ALL
SELECT 'activities sem company_id', COUNT(*)
FROM public.activities WHERE company_id IS NULL
UNION ALL
SELECT 'projects sem company_id', COUNT(*)
FROM public.projects WHERE company_id IS NULL
UNION ALL
SELECT 'whatsapp_atendimentos sem company_id', COUNT(*)
FROM public.whatsapp_atendimentos WHERE company_id IS NULL;

-- =====================================================
-- 5. COMENTÁRIOS FINAIS
-- =====================================================

-- Este script:
-- 1. Cria empresas para usuários existentes que não têm empresa
-- 2. Atualiza todos os profiles com o company_id correto
-- 3. Migra todos os dados existentes para o sistema de isolamento por empresa
-- 4. Verifica se a migração foi bem-sucedida
-- 5. Mantém a integridade dos dados existentes
