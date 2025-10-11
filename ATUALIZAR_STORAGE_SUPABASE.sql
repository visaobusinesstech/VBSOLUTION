-- SCRIPT PARA ATUALIZAR CONFIGURAÇÕES DE STORAGE PARA ARQUIVOS MAIORES
-- Execute este script no SQL Editor do Supabase

-- 1. Atualizar configurações do bucket para permitir arquivos maiores
UPDATE storage.buckets 
SET 
  file_size_limit = 209715200, -- 200MB em bytes
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
    'image/svg+xml', 'image/bmp', 'image/tiff', 'image/ico',
    'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 
    'video/webm', 'video/mkv', 'video/3gp', 'video/m4v'
  ]
WHERE id = 'feed-media';

-- 2. Se o bucket não existir, criar com as configurações corretas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'feed-media', 
  'feed-media', 
  true, 
  209715200, -- 200MB
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
    'image/svg+xml', 'image/bmp', 'image/tiff', 'image/ico',
    'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 
    'video/webm', 'video/mkv', 'video/3gp', 'video/m4v'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 209715200,
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
    'image/svg+xml', 'image/bmp', 'image/tiff', 'image/ico',
    'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 
    'video/webm', 'video/mkv', 'video/3gp', 'video/m4v'
  ];

-- 3. Verificar se as políticas de storage estão corretas
DROP POLICY IF EXISTS "Users can upload feed media" ON storage.objects;
DROP POLICY IF EXISTS "Users can view feed media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own feed media" ON storage.objects;

-- 4. Recriar políticas de storage
CREATE POLICY "Users can upload feed media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'feed-media');

CREATE POLICY "Users can view feed media" ON storage.objects
  FOR SELECT USING (bucket_id = 'feed-media');

CREATE POLICY "Users can delete their own feed media" ON storage.objects
  FOR DELETE USING (bucket_id = 'feed-media');

-- 5. Verificar configurações
SELECT 
  id, 
  name, 
  public, 
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'feed-media';
