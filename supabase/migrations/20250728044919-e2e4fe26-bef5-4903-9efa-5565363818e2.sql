
-- Adicionar coluna para imagem no inventário
ALTER TABLE products ADD COLUMN image_url TEXT;

-- Criar tabela para armazenar imagens do inventário
CREATE TABLE inventory_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar política RLS para inventory_images
ALTER TABLE inventory_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to inventory_images" 
  ON inventory_images 
  FOR ALL 
  USING (true);

-- Criar bucket para imagens do inventário se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('inventory-images', 'inventory-images', true)
ON CONFLICT (id) DO NOTHING;
