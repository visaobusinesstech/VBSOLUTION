-- Migração para tornar owner_id opcional temporariamente
-- Data: 2025-08-01

-- Tornar owner_id opcional (permitir NULL)
DO $$ 
BEGIN
    ALTER TABLE public.leads ALTER COLUMN owner_id DROP NOT NULL;
    RAISE NOTICE 'Coluna owner_id tornada opcional';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Erro ao modificar owner_id: %', SQLERRM;
END $$;
