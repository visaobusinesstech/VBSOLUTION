-- Tabela para armazenar as ações/configurações dos Agentes IA
CREATE TABLE IF NOT EXISTS ai_agent_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ai_agent_config_id UUID NOT NULL REFERENCES ai_agent_configs(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Informações básicas do estágio
    name VARCHAR(255) NOT NULL,
    condition TEXT NOT NULL,
    instruction_prompt TEXT,
    
    -- Dados para coleta
    collect_data JSONB DEFAULT '[]'::jsonb,
    
    -- Ação a ser executada
    action VARCHAR(100),
    action_config JSONB DEFAULT '{}'::jsonb,
    
    -- Instruções finais
    final_instructions TEXT,
    
    -- Configurações de follow-up
    follow_up_timeout INTEGER DEFAULT 0, -- em minutos, 0 = sem timeout
    follow_up_action VARCHAR(100) DEFAULT 'none', -- none, transfer, close, restart
    
    -- Status e controle
    is_active BOOLEAN DEFAULT true,
    execution_order INTEGER DEFAULT 0,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_agent_actions_config_id ON ai_agent_actions(ai_agent_config_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_actions_owner_id ON ai_agent_actions(owner_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_actions_active ON ai_agent_actions(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_agent_actions_order ON ai_agent_actions(execution_order);

-- RLS (Row Level Security)
ALTER TABLE ai_agent_actions ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas suas próprias ações
CREATE POLICY "Users can view their own ai_agent_actions" ON ai_agent_actions
    FOR SELECT USING (auth.uid() = owner_id);

-- Política para permitir que usuários insiram suas próprias ações
CREATE POLICY "Users can insert their own ai_agent_actions" ON ai_agent_actions
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Política para permitir que usuários atualizem suas próprias ações
CREATE POLICY "Users can update their own ai_agent_actions" ON ai_agent_actions
    FOR UPDATE USING (auth.uid() = owner_id);

-- Política para permitir que usuários deletem suas próprias ações
CREATE POLICY "Users can delete their own ai_agent_actions" ON ai_agent_actions
    FOR DELETE USING (auth.uid() = owner_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_ai_agent_actions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER trigger_update_ai_agent_actions_updated_at
    BEFORE UPDATE ON ai_agent_actions
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_agent_actions_updated_at();

-- Função para definir created_by automaticamente
CREATE OR REPLACE FUNCTION set_ai_agent_actions_created_by()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_by = auth.uid();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para definir created_by automaticamente
CREATE TRIGGER trigger_set_ai_agent_actions_created_by
    BEFORE INSERT ON ai_agent_actions
    FOR EACH ROW
    EXECUTE FUNCTION set_ai_agent_actions_created_by();

-- Comentários para documentação
COMMENT ON TABLE ai_agent_actions IS 'Tabela para armazenar as ações e estágios dos Agentes IA';
COMMENT ON COLUMN ai_agent_actions.ai_agent_config_id IS 'Referência para a configuração do Agente IA';
COMMENT ON COLUMN ai_agent_actions.owner_id IS 'ID do proprietário da ação';
COMMENT ON COLUMN ai_agent_actions.name IS 'Nome do estágio/ação';
COMMENT ON COLUMN ai_agent_actions.condition IS 'Condição para executar o estágio';
COMMENT ON COLUMN ai_agent_actions.instruction_prompt IS 'Prompt de instruções para o Agente IA';
COMMENT ON COLUMN ai_agent_actions.collect_data IS 'Array de dados que o agente deve coletar';
COMMENT ON COLUMN ai_agent_actions.action IS 'Tipo de ação a ser executada';
COMMENT ON COLUMN ai_agent_actions.action_config IS 'Configurações específicas da ação';
COMMENT ON COLUMN ai_agent_actions.final_instructions IS 'Instruções finais para responder ao usuário';
COMMENT ON COLUMN ai_agent_actions.follow_up_timeout IS 'Timeout em minutos para follow-up';
COMMENT ON COLUMN ai_agent_actions.follow_up_action IS 'Ação a ser executada após timeout';
COMMENT ON COLUMN ai_agent_actions.is_active IS 'Se o estágio está ativo';
COMMENT ON COLUMN ai_agent_actions.execution_order IS 'Ordem de execução dos estágios';
