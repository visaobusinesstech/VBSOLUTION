-- Corrigir tabela whatsapp_mensagens
-- Execute este SQL no Supabase SQL Editor

-- 1. Verificar estrutura atual da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'whatsapp_mensagens' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Adicionar coluna phone se não existir
ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- 3. Atualizar registros existentes com phone baseado no chat_id
UPDATE public.whatsapp_mensagens 
SET phone = SPLIT_PART(chat_id, '@', 1)
WHERE phone IS NULL AND chat_id IS NOT NULL;

-- 4. Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'whatsapp_mensagens' AND table_schema = 'public'
AND column_name = 'phone';

-- 5. Testar inserção com phone
INSERT INTO public.whatsapp_mensagens (
    id,
    message_id,
    chat_id,
    conteudo,
    message_type,
    remetente,
    timestamp,
    lida,
    connection_id,
    owner_id,
    phone
) VALUES (
    'test_phone_123',
    'test_phone_123',
    '554796643900@s.whatsapp.net',
    'Teste de mensagem com phone',
    'TEXTO',
    'CLIENTE',
    NOW(),
    false,
    'test_connection',
    '905b926a-785a-4f6d-9c3a-9455729500b3',
    '554796643900'
);

-- 6. Verificar se a inserção funcionou
SELECT id, chat_id, phone, conteudo, remetente, timestamp
FROM public.whatsapp_mensagens 
WHERE id = 'test_phone_123';

-- 7. Limpar dados de teste
DELETE FROM public.whatsapp_mensagens 
WHERE id = 'test_phone_123';

