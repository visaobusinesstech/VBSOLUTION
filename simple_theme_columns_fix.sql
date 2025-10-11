-- Script simples para adicionar colunas de tema
-- Execute este script no SQL Editor do Supabase

-- Adicionar colunas de tema (ignora se já existirem)
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS sidebar_color TEXT DEFAULT '#dee2e3',
ADD COLUMN IF NOT EXISTS topbar_color TEXT DEFAULT '#3F30F1',
ADD COLUMN IF NOT EXISTS button_color TEXT DEFAULT '#4A5477';

-- Verificar se as colunas foram criadas
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'company_settings' 
AND column_name IN ('sidebar_color', 'topbar_color', 'button_color')
ORDER BY column_name;

-- Testar inserção de dados
INSERT INTO company_settings (
  company_id, 
  company_name, 
  sidebar_color, 
  topbar_color, 
  button_color
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Teste Colunas Tema',
  '#ff0000',
  '#00ff00', 
  '#0000ff'
) ON CONFLICT (company_id) DO UPDATE SET
  sidebar_color = EXCLUDED.sidebar_color,
  topbar_color = EXCLUDED.topbar_color,
  button_color = EXCLUDED.button_color,
  updated_at = NOW();

-- Verificar dados inseridos
SELECT 
  id,
  company_id,
  company_name,
  sidebar_color,
  topbar_color,
  button_color,
  created_at,
  updated_at
FROM company_settings 
WHERE company_id = '11111111-1111-1111-1111-111111111111'
ORDER BY updated_at DESC;
