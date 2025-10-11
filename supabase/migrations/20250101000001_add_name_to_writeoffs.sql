-- Adicionar coluna 'name' à tabela writeoffs existente
ALTER TABLE public.writeoffs 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Atualizar registros existentes para ter um nome padrão baseado no ID
UPDATE public.writeoffs 
SET name = 'Baixa #' || SUBSTRING(id::text, 1, 8)
WHERE name IS NULL OR name = '';

-- Tornar a coluna name obrigatória (após popular os dados existentes)
ALTER TABLE public.writeoffs 
ALTER COLUMN name SET NOT NULL;
