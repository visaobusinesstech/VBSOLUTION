-- Script para verificar se as colunas de tema existem na tabela company_settings
-- Execute este script no SQL Editor do Supabase

-- Verificar estrutura da tabela company_settings
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'company_settings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar se as colunas de tema existem especificamente
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'company_settings' 
    AND column_name = 'sidebar_color'
  ) THEN 'EXISTS' ELSE 'MISSING' END as sidebar_color_status,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'company_settings' 
    AND column_name = 'topbar_color'
  ) THEN 'EXISTS' ELSE 'MISSING' END as topbar_color_status,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'company_settings' 
    AND column_name = 'button_color'
  ) THEN 'EXISTS' ELSE 'MISSING' END as button_color_status;

-- Verificar dados existentes na tabela
SELECT id, company_id, company_name, sidebar_color, topbar_color, button_color, created_at, updated_at
FROM company_settings 
ORDER BY created_at DESC 
LIMIT 5;
