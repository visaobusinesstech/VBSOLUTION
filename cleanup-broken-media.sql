-- Script para limpar mensagens com URLs de mídia inválidas
-- Execute este script no Supabase SQL Editor

-- 1. Primeiro, vamos ver quantas mensagens têm URLs inválidas
SELECT 
  COUNT(*) as total_invalid,
  COUNT(CASE WHEN media_url = 'undefined' THEN 1 END) as undefined_urls,
  COUNT(CASE WHEN media_url = 'null' THEN 1 END) as null_urls,
  COUNT(CASE WHEN media_url = '' THEN 1 END) as empty_urls,
  COUNT(CASE WHEN media_url = 'mmg' THEN 1 END) as mmg_urls,
  COUNT(CASE WHEN media_url LIKE '%localhost:3000/api/media%' THEN 1 END) as localhost_urls
FROM whatsapp_mensagens 
WHERE media_url IS NOT NULL;

-- 2. Ver algumas mensagens com URLs inválidas (para revisar antes de deletar)
SELECT 
  id, 
  chat_id, 
  media_url, 
  message_type,
  timestamp,
  conteudo
FROM whatsapp_mensagens 
WHERE media_url IS NOT NULL 
  AND (
    media_url = 'undefined' 
    OR media_url = 'null'
    OR media_url = ''
    OR media_url = 'mmg'
    OR media_url LIKE '%localhost:3000/api/media%'
  )
ORDER BY timestamp DESC
LIMIT 20;

-- 3. ATENÇÃO: Descomente a linha abaixo APENAS após revisar os resultados acima
-- DELETE FROM whatsapp_mensagens 
-- WHERE media_url IS NOT NULL 
--   AND (
--     media_url = 'undefined' 
--     OR media_url = 'null'
--     OR media_url = ''
--     OR media_url = 'mmg'
--     OR media_url LIKE '%localhost:3000/api/media%'
--   );

-- 4. Verificar se a limpeza foi bem-sucedida
-- SELECT COUNT(*) as remaining_invalid 
-- FROM whatsapp_mensagens 
-- WHERE media_url IS NOT NULL 
--   AND (
--     media_url = 'undefined' 
--     OR media_url = 'null'
--     OR media_url = ''
--     OR media_url = 'mmg'
--     OR media_url LIKE '%localhost:3000/api/media%'
--   );
