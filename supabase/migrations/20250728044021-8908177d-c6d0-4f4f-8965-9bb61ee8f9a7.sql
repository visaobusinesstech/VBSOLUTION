
-- Criar tabela para armazenar imagens dos produtos
CREATE TABLE public.product_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_product_images_product_id FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Habilitar RLS na tabela
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Criar policy para permitir acesso a todas as imagens de produtos
CREATE POLICY "Allow all access to product_images" 
  ON public.product_images 
  FOR ALL 
  USING (true);

-- Criar bucket para armazenar imagens de produtos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true);

-- Criar policy para permitir upload de imagens
CREATE POLICY "Allow product image uploads" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'product-images');

-- Criar policy para permitir acesso público às imagens
CREATE POLICY "Allow public access to product images" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'product-images');

-- Criar policy para permitir delete de imagens
CREATE POLICY "Allow delete product images" 
  ON storage.objects 
  FOR DELETE 
  USING (bucket_id = 'product-images');
