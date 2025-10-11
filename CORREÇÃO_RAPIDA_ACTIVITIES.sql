-- CORREÇÃO RÁPIDA - TABELA ACTIVITIES
-- Execute este script no SQL Editor do Supabase
-- Link: https://supabase.com/dashboard/project/zqlwthtkjhmjydkeghfh/sql

-- 1. ADICIONAR COLUNAS FALTANTES
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS work_group VARCHAR(255),
ADD COLUMN IF NOT EXISTS department VARCHAR(255),
ADD COLUMN IF NOT EXISTS attachments JSONB,
ADD COLUMN IF NOT EXISTS comments JSONB,
ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. VERIFICAR SE AS COLUNAS FORAM CRIADAS
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'activities' 
ORDER BY ordinal_position;

-- 3. TESTAR INSERÇÃO (OPCIONAL - para verificar se está funcionando)
-- INSERT INTO activities (title, description, type, priority, status, created_by) 
-- VALUES ('Teste de Colunas', 'Teste para verificar se as colunas foram criadas', 'task', 'medium', 'pending', '00000000-0000-0000-0000-000000000000');

-- 4. VERIFICAR POLÍTICAS RLS
SELECT 
    policyname, 
    cmd, 
    permissive
FROM pg_policies 
WHERE tablename = 'activities';
