-- Adicionar coluna owner_id na tabela products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Atualizar produtos existentes com um owner_id padrão (se necessário)
-- UPDATE public.products SET owner_id = '00000000-0000-0000-0000-000000000001' WHERE owner_id IS NULL;
