-- Script para debugar o problema de fornecedores
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

-- 2. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'suppliers';

-- 3. Verificar políticas RLS
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

-- 4. Verificar dados existentes (sem filtro de owner_id)
SELECT 
  id,
  name,
  owner_id,
  created_at
FROM public.suppliers 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Verificar se há dados para um usuário específico
-- (substitua 'USER_ID_AQUI' pelo ID real do usuário logado)
SELECT 
  id,
  name,
  owner_id,
  created_at
FROM public.suppliers 
WHERE owner_id = 'USER_ID_AQUI'
ORDER BY created_at DESC;

-- 6. Testar inserção de dados (substitua 'USER_ID_AQUI' pelo ID real do usuário)
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
--   'Fornecedor Teste Debug',
--   'Empresa Teste Debug LTDA',
--   '12.345.678/0001-90',
--   '(11) 99999-9999',
--   'São Paulo',
--   'SP',
--   'Fornecedor criado via debug',
--   'USER_ID_AQUI'
-- );

-- 7. Verificar se a inserção funcionou
-- SELECT * FROM public.suppliers WHERE name = 'Fornecedor Teste Debug';

-- 8. Limpar dados de teste
-- DELETE FROM public.suppliers WHERE name = 'Fornecedor Teste Debug';
