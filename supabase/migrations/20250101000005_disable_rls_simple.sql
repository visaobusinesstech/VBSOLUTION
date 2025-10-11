-- MIGRAÇÃO SIMPLES - DESABILITAR RLS PARA PROJETOS
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- Desabilitar RLS para a tabela projects
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view company projects" ON public.projects;
DROP POLICY IF EXISTS "Allow all access to projects" ON public.projects;
