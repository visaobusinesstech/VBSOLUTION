-- Unificar colunas phone e phone_number na tabela contacts
-- Execute este SQL no Supabase SQL Editor

-- 1. Verificar estrutura atual da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'contacts' 
  AND table_schema = 'public'
  AND column_name IN ('phone', 'phone_number')
ORDER BY column_name;

-- 2. Verificar dados existentes
SELECT 
  COUNT(*) as total_contacts,
  COUNT(phone) as phone_count,
  COUNT(phone_number) as phone_number_count,
  COUNT(CASE WHEN phone IS NOT NULL AND phone_number IS NOT NULL THEN 1 END) as both_columns
FROM public.contacts;

-- 3. Atualizar phone_number para phone onde phone está NULL
UPDATE public.contacts 
SET phone = phone_number 
WHERE phone IS NULL AND phone_number IS NOT NULL;

-- 4. Verificar se há conflitos (mesmo contato com phone e phone_number diferentes)
SELECT 
  id, 
  phone, 
  phone_number,
  CASE 
    WHEN phone = phone_number THEN 'IGUAL'
    WHEN phone IS NULL AND phone_number IS NOT NULL THEN 'PHONE_NULL'
    WHEN phone IS NOT NULL AND phone_number IS NULL THEN 'PHONE_NUMBER_NULL'
    ELSE 'DIFERENTE'
  END as status
FROM public.contacts 
WHERE phone IS NOT NULL OR phone_number IS NOT NULL
ORDER BY status;

-- 5. Resolver conflitos (manter phone, descartar phone_number)
UPDATE public.contacts 
SET phone_number = NULL 
WHERE phone IS NOT NULL AND phone_number IS NOT NULL AND phone != phone_number;

-- 6. Mover dados de phone_number para phone onde phone ainda está NULL
UPDATE public.contacts 
SET phone = phone_number 
WHERE phone IS NULL AND phone_number IS NOT NULL;

-- 7. Remover a coluna phone_number
ALTER TABLE public.contacts DROP COLUMN IF EXISTS phone_number;

-- 8. Garantir que phone seja NOT NULL e único por owner
ALTER TABLE public.contacts 
ALTER COLUMN phone SET NOT NULL;

-- 9. Criar índice único para phone por owner (se não existir)
DROP INDEX IF EXISTS uq_contacts_owner_phone;
CREATE UNIQUE INDEX uq_contacts_owner_phone 
ON public.contacts(owner_id, phone) 
WHERE phone IS NOT NULL;

-- 10. Verificar estrutura final
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'contacts' 
  AND table_schema = 'public'
  AND column_name IN ('phone', 'phone_number')
ORDER BY column_name;

-- 11. Verificar dados finais
SELECT 
  COUNT(*) as total_contacts,
  COUNT(phone) as phone_count,
  MIN(phone) as min_phone,
  MAX(phone) as max_phone
FROM public.contacts;

-- 12. Comentário de documentação
COMMENT ON COLUMN public.contacts.phone IS 'Número de telefone do contato (coluna unificada)';

