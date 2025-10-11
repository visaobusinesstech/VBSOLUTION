-- Script para corrigir a constraint da tabela feed
-- Execute este script no SQL Editor do Supabase para permitir posts de texto

-- 1. Remover a constraint existente
ALTER TABLE public.feed DROP CONSTRAINT IF EXISTS feed_type_check;

-- 2. Adicionar a nova constraint que inclui 'text'
ALTER TABLE public.feed ADD CONSTRAINT feed_type_check 
  CHECK (type IN ('text', 'image', 'video', 'event'));

-- 3. Verificar se a alteração foi aplicada
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.feed'::regclass 
  AND conname = 'feed_type_check';
