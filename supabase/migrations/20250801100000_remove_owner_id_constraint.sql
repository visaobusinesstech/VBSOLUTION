-- Migração para remover temporariamente a constraint de owner_id
-- Data: 2025-08-01

-- Remover constraint de foreign key do owner_id
DO $$ 
BEGIN
    -- Tentar remover a constraint se ela existir
    BEGIN
        ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_owner_id_fkey;
        RAISE NOTICE 'Constraint leads_owner_id_fkey removida';
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'Erro ao remover constraint leads_owner_id_fkey: %', SQLERRM;
    END;
    
    -- Tornar owner_id opcional
    BEGIN
        ALTER TABLE public.leads ALTER COLUMN owner_id DROP NOT NULL;
        RAISE NOTICE 'Coluna owner_id tornada opcional';
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'Erro ao tornar owner_id opcional: %', SQLERRM;
    END;
END $$;
