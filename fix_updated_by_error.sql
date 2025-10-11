-- Script para corrigir erro de 'updated_by' field not found
-- Execute este SQL no Supabase SQL Editor

-- 1. Verificar se a coluna updated_by existe na tabela whatsapp_sessions
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'whatsapp_sessions' 
AND column_name = 'updated_by';

-- 2. Se não existir, adicionar a coluna updated_by
ALTER TABLE public.whatsapp_sessions 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- 3. Verificar se há triggers que podem estar causando o problema
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'whatsapp_sessions';

-- 4. Verificar se há funções que podem estar causando o problema
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition LIKE '%updated_by%' 
AND routine_schema = 'public';

-- 5. Se houver triggers problemáticos, vamos desabilitá-los temporariamente
-- (Execute apenas se necessário)
-- DROP TRIGGER IF EXISTS update_updated_by_trigger ON public.whatsapp_sessions;

-- 6. Verificar a estrutura atual da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'whatsapp_sessions'
ORDER BY ordinal_position;

SELECT 'Correção do erro updated_by concluída!' as status;
