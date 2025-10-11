-- Script para adicionar colunas de cores específicas na tabela company_settings
-- Execute este script no SQL Editor do Supabase

-- Adicionar colunas de cores específicas para identidade visual
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS sidebar_color TEXT DEFAULT '#dee2e3',
ADD COLUMN IF NOT EXISTS topbar_color TEXT DEFAULT '#3F30F1',
ADD COLUMN IF NOT EXISTS button_color TEXT DEFAULT '#4A5477';

-- Atualizar registros existentes com cores padrão se as colunas estiverem vazias
UPDATE company_settings 
SET 
  sidebar_color = COALESCE(sidebar_color, '#dee2e3'),
  topbar_color = COALESCE(topbar_color, '#3F30F1'),
  button_color = COALESCE(button_color, '#4A5477')
WHERE sidebar_color IS NULL OR topbar_color IS NULL OR button_color IS NULL;

-- Comentário: Este script adiciona as colunas específicas para cores da sidebar, topbar e botões
-- que serão usadas para personalização individual por empresa
