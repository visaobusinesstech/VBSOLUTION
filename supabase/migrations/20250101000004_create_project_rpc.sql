-- Criar função RPC para criar projetos contornando RLS
CREATE OR REPLACE FUNCTION public.create_project(project_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios do criador da função
AS $$
DECLARE
    new_project public.projects%ROWTYPE;
BEGIN
    -- Inserir projeto diretamente na tabela
    INSERT INTO public.projects (
        name,
        description,
        status,
        priority,
        owner_id,
        start_date,
        end_date,
        budget,
        client_id
    ) VALUES (
        (project_data->>'name')::TEXT,
        (project_data->>'description')::TEXT,
        COALESCE((project_data->>'status')::TEXT, 'planning'),
        COALESCE((project_data->>'priority')::TEXT, 'medium'),
        (project_data->>'owner_id')::UUID,
        CASE 
            WHEN project_data->>'start_date' IS NOT NULL 
            THEN (project_data->>'start_date')::DATE 
            ELSE NULL 
        END,
        CASE 
            WHEN project_data->>'end_date' IS NOT NULL 
            THEN (project_data->>'end_date')::DATE 
            ELSE NULL 
        END,
        CASE 
            WHEN project_data->>'budget' IS NOT NULL 
            THEN (project_data->>'budget')::DECIMAL(12,2) 
            ELSE NULL 
        END,
        CASE 
            WHEN project_data->>'client_id' IS NOT NULL 
            THEN (project_data->>'client_id')::UUID 
            ELSE NULL 
        END
    ) RETURNING * INTO new_project;
    
    -- Retornar o projeto criado como JSON
    RETURN to_jsonb(new_project);
END;
$$;
