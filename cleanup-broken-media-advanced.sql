-- Script para limpar URLs de mídia quebradas do Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Primeiro, vamos ver quantas mensagens têm URLs problemáticas
SELECT 
  COUNT(*) as total_messages,
  COUNT(CASE WHEN media_url IS NOT NULL THEN 1 END) as messages_with_media,
  COUNT(CASE WHEN media_url LIKE '%localhost:3000/api/media%' THEN 1 END) as localhost_media,
  COUNT(CASE WHEN media_url LIKE '%mmg%' THEN 1 END) as mmg_media,
  COUNT(CASE WHEN media_url LIKE '%;%20codecs%' THEN 1 END) as codecs_media,
  COUNT(CASE WHEN media_url = 'undefined' OR media_url = 'null' THEN 1 END) as undefined_media
FROM whatsapp_mensagens;

-- 2. Ver exemplos de URLs problemáticas
SELECT 
  id, 
  chat_id, 
  media_url, 
  message_type,
  timestamp 
FROM whatsapp_mensagens 
WHERE media_url IS NOT NULL 
  AND (
    media_url = 'undefined' 
    OR media_url = 'null'
    OR media_url = ''
    OR media_url LIKE '%localhost:3000/api/media%'
    OR media_url LIKE '%mmg%'
    OR media_url LIKE '%;%20codecs%'
    OR media_url LIKE '%web.whatsapp.net%'
    OR media_url LIKE '%mmg.whatsapp.net%'
  )
ORDER BY timestamp DESC
LIMIT 20;

-- 3. ATENÇÃO: Execute apenas após revisar os resultados acima
-- Este comando irá limpar TODAS as URLs de mídia problemáticas
-- 
-- UPDATE whatsapp_mensagens 
-- SET media_url = NULL, media_mime = NULL
-- WHERE media_url IS NOT NULL 
--   AND (
--     media_url = 'undefined' 
--     OR media_url = 'null'
--     OR media_url = ''
--     OR media_url LIKE '%localhost:3000/api/media%'
--     OR media_url LIKE '%mmg%'
--     OR media_url LIKE '%;%20codecs%'
--     OR media_url LIKE '%web.whatsapp.net%'
--     OR media_url LIKE '%mmg.whatsapp.net%'
--   );

-- 4. Verificar resultado após limpeza
-- SELECT 
--   COUNT(*) as total_messages,
--   COUNT(CASE WHEN media_url IS NOT NULL THEN 1 END) as messages_with_media
-- FROM whatsapp_mensagens;
