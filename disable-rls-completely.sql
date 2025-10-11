-- Script para desabilitar RLS temporariamente na tabela suppliers
-- Execute este script no SQL Editor do Supabase

-- Desabilitar RLS completamente (temporário para desenvolvimento)
ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY;

-- Verificar se foi desabilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'suppliers';
