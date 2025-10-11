-- Criar bucket para avatares de usuários
-- Data: 2025-01-15

-- 1. Criar bucket user-avatars com configurações para arquivos de até 100MB
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'user-avatars', 
  'user-avatars', 
  true, 
  104857600, -- 100MB em bytes
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
    'image/svg+xml', 'image/bmp', 'image/tiff', 'image/ico',
    'image/tga', 'image/psd', 'image/raw', 'image/heic', 'image/heif'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
    'image/svg+xml', 'image/bmp', 'image/tiff', 'image/ico',
    'image/tga', 'image/psd', 'image/raw', 'image/heic', 'image/heif'
  ];

-- 2. Criar políticas de storage para user-avatars
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete avatars" ON storage.objects;

-- Política para upload de avatares (apenas usuários autenticados)
CREATE POLICY "Users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-avatars' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = 'avatars'
  );

-- Política para visualizar avatares (acesso público)
CREATE POLICY "Users can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-avatars');

-- Política para atualizar avatares (apenas o próprio usuário)
CREATE POLICY "Users can update avatars" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'user-avatars' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = 'avatars'
  );

-- Política para deletar avatares (apenas o próprio usuário)
CREATE POLICY "Users can delete avatars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-avatars' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = 'avatars'
  );
