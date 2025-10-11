-- Script para remover a coluna atendimento_id desnecessária
-- Execute este script no Supabase SQL Editor

-- 1. Remover a coluna atendimento_id (não é mais necessária)
ALTER TABLE whatsapp_mensagens DROP COLUMN IF EXISTS atendimento_id;

-- 2. Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'whatsapp_mensagens' 
ORDER BY ordinal_position;
