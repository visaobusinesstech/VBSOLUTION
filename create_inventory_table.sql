-- A tabela inventory já existe no sistema com a seguinte estrutura:
-- CREATE TABLE IF NOT EXISTS public.inventory (
--   id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
--   owner_id UUID NOT NULL REFERENCES auth.users(id), -- Usuário proprietário
--   product_id UUID NOT NULL REFERENCES public.products(id),
--   quantity INTEGER NOT NULL DEFAULT 0,
--   location TEXT,
--   last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
--   created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
--   updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
-- );

-- A tabela products também já existe com a seguinte estrutura:
-- CREATE TABLE IF NOT EXISTS public.products (
--   id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
--   owner_id UUID NOT NULL REFERENCES auth.users(id), -- Usuário proprietário
--   company_id UUID REFERENCES public.companies(id),
--   name TEXT NOT NULL,
--   type TEXT NOT NULL DEFAULT 'product', -- 'product' ou 'service'
--   sku TEXT,
--   description TEXT,
--   category TEXT,
--   base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
--   currency TEXT DEFAULT 'BRL',
--   unit TEXT NOT NULL DEFAULT 'unidade',
--   stock INTEGER,
--   min_stock INTEGER DEFAULT 0,
--   image_url TEXT,
--   status TEXT DEFAULT 'active', -- 'active', 'inactive'
--   created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
--   updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
-- );

-- As tabelas já têm RLS habilitado e políticas configuradas.
-- O sistema está pronto para uso!

-- Verificar se as tabelas existem e estão configuradas corretamente
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('inventory', 'products') 
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
