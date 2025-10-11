-- Script para verificar a estrutura da tabela suppliers
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela suppliers existe
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'suppliers' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar as políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'suppliers';

-- 3. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'suppliers';

-- 4. Testar inserção de dados (substitua 'user_id_aqui' pelo ID real do usuário)
-- INSERT INTO public.suppliers (
--   name,
--   fantasy_name,
--   cnpj,
--   phone,
--   city,
--   state,
--   notes,
--   owner_id
-- ) VALUES (
--   'Fornecedor Teste',
--   'Empresa Teste LTDA',
--   '12.345.678/0001-90',
--   '(11) 99999-9999',
--   'São Paulo',
--   'SP',
--   'Fornecedor de teste',
--   'user_id_aqui'
-- );

-- 5. Verificar dados existentes
SELECT * FROM public.suppliers LIMIT 5;
