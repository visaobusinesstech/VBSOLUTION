
-- Criar bucket para imagens do inventário
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inventory-images',
  'inventory-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Criar política para permitir que usuários façam upload de imagens
CREATE POLICY "Users can upload inventory images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'inventory-images' AND
  (storage.foldername(name))[1] = 'inventory'
);

-- Criar política para permitir que usuários vejam as imagens
CREATE POLICY "Users can view inventory images" ON storage.objects
FOR SELECT USING (bucket_id = 'inventory-images');

-- Criar política para permitir que usuários deletem suas próprias imagens
CREATE POLICY "Users can delete inventory images" ON storage.objects
FOR DELETE USING (bucket_id = 'inventory-images');
