-- Migração para melhorar a tabela de atividades e adicionar funcionalidades
-- Data: 2025-08-01

-- 1. Adicionar campos adicionais à tabela activities
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'task',
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id),
ADD COLUMN IF NOT EXISTS project_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS work_group VARCHAR(255),
ADD COLUMN IF NOT EXISTS department VARCHAR(255),
ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS attachments JSONB,
ADD COLUMN IF NOT EXISTS comments JSONB,
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_date TIMESTAMP WITH TIME ZONE;

-- 2. Criar tabela de comentários de atividades
CREATE TABLE IF NOT EXISTS activity_comments (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela de anexos de atividades
CREATE TABLE IF NOT EXISTS activity_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
    file_size INTEGER,
  file_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar tabela de histórico de atividades
CREATE TABLE IF NOT EXISTS activity_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  action VARCHAR(100) NOT NULL,
  old_value JSONB,
  new_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Habilitar RLS nas novas tabelas
ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_history ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS para activity_comments
CREATE POLICY IF NOT EXISTS "Users can view comments of activities they have access to" ON activity_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM activities a 
      WHERE a.id = activity_comments.activity_id 
      AND (a.created_by = auth.uid() OR a.assigned_to = auth.uid())
    )
  );

CREATE POLICY IF NOT EXISTS "Users can create comments on activities they have access to" ON activity_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM activities a 
      WHERE a.id = activity_comments.activity_id 
      AND (a.created_by = auth.uid() OR a.assigned_to = auth.uid())
    )
  );

CREATE POLICY IF NOT EXISTS "Users can update their own comments" ON activity_comments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can delete their own comments" ON activity_comments
  FOR DELETE USING (user_id = auth.uid());

-- 7. Criar políticas RLS para activity_attachments
CREATE POLICY IF NOT EXISTS "Users can view attachments of activities they have access to" ON activity_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM activities a 
      WHERE a.id = activity_attachments.activity_id 
      AND (a.created_by = auth.uid() OR a.assigned_to = auth.uid())
    )
  );

CREATE POLICY IF NOT EXISTS "Users can create attachments on activities they have access to" ON activity_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM activities a 
      WHERE a.id = activity_attachments.activity_id 
      AND (a.created_by = auth.uid() OR a.assigned_to = auth.uid())
    )
  );

CREATE POLICY IF NOT EXISTS "Users can delete their own attachments" ON activity_attachments
  FOR DELETE USING (user_id = auth.uid());

-- 8. Criar políticas RLS para activity_history
CREATE POLICY IF NOT EXISTS "Users can view history of activities they have access to" ON activity_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM activities a 
      WHERE a.id = activity_history.activity_id 
      AND (a.created_by = auth.uid() OR a.assigned_to = auth.uid())
    )
  );

CREATE POLICY IF NOT EXISTS "System can create history records" ON activity_history
    FOR INSERT WITH CHECK (true);

-- 9. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_activities_company_id ON activities(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_project_id ON activities(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_work_group ON activities(work_group);
CREATE INDEX IF NOT EXISTS idx_activities_department ON activities(department);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_priority ON activities(priority);
CREATE INDEX IF NOT EXISTS idx_activities_due_date ON activities(due_date);
CREATE INDEX IF NOT EXISTS idx_activities_start_date ON activities(start_date);
CREATE INDEX IF NOT EXISTS idx_activities_completed_date ON activities(completed_date);

CREATE INDEX IF NOT EXISTS idx_activity_comments_activity_id ON activity_comments(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_user_id ON activity_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_attachments_activity_id ON activity_attachments(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_history_activity_id ON activity_history(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_history_user_id ON activity_history_user_id(user_id);

-- 10. Criar função para registrar histórico automaticamente
CREATE OR REPLACE FUNCTION log_activity_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_history (activity_id, user_id, action, new_value)
    VALUES (NEW.id, NEW.created_by, 'created', to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO activity_history (activity_id, user_id, action, old_value, new_value)
    VALUES (NEW.id, COALESCE(NEW.assigned_to, NEW.created_by), 'updated', to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO activity_history (activity_id, user_id, action, old_value)
    VALUES (OLD.id, OLD.created_by, 'deleted', to_jsonb(OLD));
    RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 11. Criar trigger para registrar histórico automaticamente
DROP TRIGGER IF EXISTS trigger_log_activity_change ON activities;
CREATE TRIGGER trigger_log_activity_change
  AFTER INSERT OR UPDATE OR DELETE ON activities
  FOR EACH ROW EXECUTE FUNCTION log_activity_change();

-- 12. Atualizar tipos de dados existentes se necessário
UPDATE activities SET 
  type = COALESCE(type, 'task'),
  status = COALESCE(status, 'pending'),
  priority = COALESCE(priority, 'medium'),
  progress = COALESCE(progress, 0)
WHERE type IS NULL OR status IS NULL OR priority IS NULL OR progress IS NULL;

-- 13. Comentários para documentação
COMMENT ON TABLE activities IS 'Tabela principal de atividades/tarefas do sistema';
COMMENT ON TABLE activity_comments IS 'Comentários das atividades';
COMMENT ON TABLE activity_attachments IS 'Anexos das atividades';
COMMENT ON TABLE activity_history IS 'Histórico de mudanças das atividades';
COMMENT ON COLUMN activities.type IS 'Tipo da atividade: task, meeting, call, other';
COMMENT ON COLUMN activities.progress IS 'Progresso da atividade em porcentagem (0-100)';
COMMENT ON COLUMN activities.tags IS 'Tags para categorização da atividade';
COMMENT ON COLUMN activities.attachments IS 'JSON com informações dos anexos';
COMMENT ON COLUMN activities.comments IS 'JSON com comentários rápidos';
