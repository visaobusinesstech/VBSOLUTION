-- Script para empresas com owner_id obrigatório
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- 1. Desabilitar RLS para companies
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;

-- 2. Remover políticas existentes
DROP POLICY IF EXISTS "Users can view their own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can create their own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can update their own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can delete their own companies" ON public.companies;
DROP POLICY IF EXISTS "Allow all access to companies" ON public.companies;

-- 3. Adicionar coluna owner_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' 
        AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE public.companies ADD COLUMN owner_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 4. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON public.companies(owner_id);
