-- Adicionar colunas para Kanban drag & drop
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS kanban_column TEXT DEFAULT 'todo',
ADD COLUMN IF NOT EXISTS position DOUBLE PRECISION;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_activities_user_kanban_position 
ON activities (owner_id, kanban_column, position);

-- Inicializar posições existentes
DO $$
DECLARE
    activity_record RECORD;
    position_counter DOUBLE PRECISION := 1000;
BEGIN
    -- Atualizar atividades existentes com posições sequenciais
    FOR activity_record IN 
        SELECT id, owner_id, status 
        FROM activities 
        WHERE kanban_column IS NULL OR position IS NULL
        ORDER BY owner_id, created_at
    LOOP
        -- Mapear status para coluna do Kanban
        UPDATE activities 
        SET 
            kanban_column = CASE 
                WHEN status IN ('pending', 'open', 'todo') THEN 'todo'
                WHEN status IN ('in_progress', 'doing') THEN 'doing'
                WHEN status IN ('completed', 'done') THEN 'done'
                ELSE 'todo'
            END,
            position = position_counter
        WHERE id = activity_record.id;
        
        position_counter := position_counter + 1000;
    END LOOP;
END $$;

-- Atualizar RLS policies se necessário
-- Verificar se RLS está habilitado
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'activities' 
        AND policyname = 'Users can view own activities'
    ) THEN
        -- Criar policy para SELECT
        CREATE POLICY "Users can view own activities" ON activities
        FOR SELECT USING (owner_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'activities' 
        AND policyname = 'Users can insert own activities'
    ) THEN
        -- Criar policy para INSERT
        CREATE POLICY "Users can insert own activities" ON activities
        FOR INSERT WITH CHECK (owner_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'activities' 
        AND policyname = 'Users can update own activities'
    ) THEN
        -- Criar policy para UPDATE
        CREATE POLICY "Users can update own activities" ON activities
        FOR UPDATE USING (owner_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'activities' 
        AND policyname = 'Users can delete own activities'
    ) THEN
        -- Criar policy para DELETE
        CREATE POLICY "Users can delete own activities" ON activities
        FOR DELETE USING (owner_id = auth.uid());
    END IF;
END $$;
