
-- Atualizar a tabela products para incluir currency
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BRL';

-- Atualizar a tabela products para incluir uma referência de moeda
UPDATE public.products 
SET currency = 'BRL' 
WHERE currency IS NULL;
