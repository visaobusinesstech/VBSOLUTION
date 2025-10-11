-- Script SQL completo para configurar o sistema de Pipeline de Leads
-- Execute este script no Supabase SQL Editor

-- 1. Criar tabela pipeline_stages
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    position INTEGER NOT NULL,
    color VARCHAR(7) DEFAULT '#3b82f6',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Adicionar colunas na tabela leads (se não existirem)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES pipelines(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL;

-- 3. Inserir etapas padrão (usando o ID correto da pipeline existente)
INSERT INTO pipeline_stages (id, pipeline_id, name, position, color, is_active) VALUES
('10000000-0000-0000-0000-000000000001', 'f3eec962-47e7-49cb-8d5d-40a719494e18', 'Novo Lead', 1, '#ef4444', TRUE),
('10000000-0000-0000-0000-000000000002', 'f3eec962-47e7-49cb-8d5d-40a719494e18', 'Contato Inicial', 2, '#f59e0b', TRUE),
('10000000-0000-0000-0000-000000000003', 'f3eec962-47e7-49cb-8d5d-40a719494e18', 'Proposta', 3, '#3b82f6', TRUE),
('10000000-0000-0000-0000-000000000004', 'f3eec962-47e7-49cb-8d5d-40a719494e18', 'Reunião', 4, '#8b5cf6', TRUE),
('10000000-0000-0000-0000-000000000005', 'f3eec962-47e7-49cb-8d5d-40a719494e18', 'Fechamento', 5, '#10b981', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 4. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_pipeline_id ON pipeline_stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_position ON pipeline_stages(pipeline_id, position);
CREATE INDEX IF NOT EXISTS idx_leads_pipeline_id ON leads(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage_id ON leads(stage_id);

-- 5. Configurar RLS (Row Level Security)
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para pipeline_stages
CREATE POLICY "Users can view all pipeline stages" ON pipeline_stages
    FOR SELECT USING (true);

CREATE POLICY "Users can insert pipeline stages" ON pipeline_stages
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update pipeline stages" ON pipeline_stages
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete pipeline stages" ON pipeline_stages
    FOR DELETE USING (true);

-- 7. Verificar se funcionou
SELECT 'Configuração concluída!' as status;

-- 8. Mostrar etapas criadas
SELECT 
    ps.position,
    ps.name,
    ps.color,
    p.name as pipeline_name
FROM pipeline_stages ps
JOIN pipelines p ON ps.pipeline_id = p.id
ORDER BY ps.position;

-- 9. Mostrar estrutura da tabela leads
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leads' 
AND column_name IN ('pipeline_id', 'stage_id')
ORDER BY column_name;

