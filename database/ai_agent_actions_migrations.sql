-- Migrações para conectar ai_agent_actions com outras tabelas do sistema
-- IMPORTANTE: Execute primeiro o arquivo supporting_tables_migration.sql

-- 1. Adicionar coluna de referência para contatos (opcional)
ALTER TABLE ai_agent_actions 
ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contatos(id) ON DELETE CASCADE;

-- 2. Adicionar coluna para referenciar conversas (opcional)
ALTER TABLE ai_agent_actions 
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversas(id) ON DELETE CASCADE;

-- 3. Adicionar coluna para referenciar equipes (para ações de transferência)
ALTER TABLE ai_agent_actions 
ADD COLUMN IF NOT EXISTS target_team_id UUID REFERENCES equipes(id) ON DELETE SET NULL;

-- 4. Adicionar coluna para referenciar usuários específicos (para ações de transferência)
ALTER TABLE ai_agent_actions 
ADD COLUMN IF NOT EXISTS target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 5. Adicionar coluna para configurações de integração (Google Calendar, APIs, etc.)
ALTER TABLE ai_agent_actions 
ADD COLUMN IF NOT EXISTS integration_config JSONB DEFAULT '{}'::jsonb;

-- 6. Adicionar coluna para variáveis customizadas
ALTER TABLE ai_agent_actions 
ADD COLUMN IF NOT EXISTS custom_variables JSONB DEFAULT '{}'::jsonb;

-- 7. Adicionar coluna para configurações de chunking (relacionado ao sistema Redis/BullMQ)
ALTER TABLE ai_agent_actions 
ADD COLUMN IF NOT EXISTS chunking_config JSONB DEFAULT '{
    "enabled": true,
    "max_chunk_size": 200,
    "debounce_time": 30000,
    "delay_between_chunks": 1000
}'::jsonb;

-- 8. Adicionar coluna para configurações de validação
ALTER TABLE ai_agent_actions 
ADD COLUMN IF NOT EXISTS validation_rules JSONB DEFAULT '{}'::jsonb;

-- 9. Adicionar coluna para histórico de execução
ALTER TABLE ai_agent_actions 
ADD COLUMN IF NOT EXISTS execution_history JSONB DEFAULT '[]'::jsonb;

-- 10. Adicionar coluna para métricas de performance
ALTER TABLE ai_agent_actions 
ADD COLUMN IF NOT EXISTS performance_metrics JSONB DEFAULT '{
    "execution_count": 0,
    "success_rate": 0.0,
    "average_response_time": 0,
    "last_executed_at": null
}'::jsonb;

-- Índices adicionais para performance
CREATE INDEX IF NOT EXISTS idx_ai_agent_actions_contact_id ON ai_agent_actions(contact_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_actions_conversation_id ON ai_agent_actions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_actions_target_team_id ON ai_agent_actions(target_team_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_actions_target_user_id ON ai_agent_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_actions_created_at ON ai_agent_actions(created_at);

-- Função para buscar ações ativas de um agente
CREATE OR REPLACE FUNCTION get_active_ai_agent_actions(p_agent_config_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    condition TEXT,
    instruction_prompt TEXT,
    collect_data JSONB,
    action VARCHAR(100),
    action_config JSONB,
    final_instructions TEXT,
    follow_up_timeout INTEGER,
    follow_up_action VARCHAR(100),
    execution_order INTEGER,
    chunking_config JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.name,
        a.condition,
        a.instruction_prompt,
        a.collect_data,
        a.action,
        a.action_config,
        a.final_instructions,
        a.follow_up_timeout,
        a.follow_up_action,
        a.execution_order,
        a.chunking_config
    FROM ai_agent_actions a
    WHERE a.ai_agent_config_id = p_agent_config_id
    AND a.is_active = true
    ORDER BY a.execution_order ASC, a.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar métricas de execução
CREATE OR REPLACE FUNCTION update_ai_agent_action_metrics(
    p_action_id UUID,
    p_success BOOLEAN,
    p_response_time INTEGER
)
RETURNS VOID AS $$
DECLARE
    current_metrics JSONB;
    new_count INTEGER;
    new_success_rate FLOAT;
    new_avg_time INTEGER;
BEGIN
    -- Buscar métricas atuais
    SELECT performance_metrics INTO current_metrics
    FROM ai_agent_actions
    WHERE id = p_action_id;
    
    -- Calcular novas métricas
    new_count := COALESCE((current_metrics->>'execution_count')::INTEGER, 0) + 1;
    
    -- Calcular taxa de sucesso
    IF p_success THEN
        new_success_rate := COALESCE((current_metrics->>'success_rate')::FLOAT, 0.0) + (1.0 / new_count);
    ELSE
        new_success_rate := COALESCE((current_metrics->>'success_rate')::FLOAT, 0.0) * ((new_count - 1)::FLOAT / new_count);
    END IF;
    
    -- Calcular tempo médio de resposta
    new_avg_time := COALESCE((current_metrics->>'average_response_time')::INTEGER, 0);
    new_avg_time := (new_avg_time * (new_count - 1) + p_response_time) / new_count;
    
    -- Atualizar métricas
    UPDATE ai_agent_actions
    SET performance_metrics = jsonb_build_object(
        'execution_count', new_count,
        'success_rate', new_success_rate,
        'average_response_time', new_avg_time,
        'last_executed_at', NOW()
    )
    WHERE id = p_action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para registrar execução no histórico
CREATE OR REPLACE FUNCTION log_ai_agent_action_execution(
    p_action_id UUID,
    p_contact_id UUID,
    p_conversation_id UUID,
    p_input_data JSONB,
    p_output_data JSONB,
    p_success BOOLEAN,
    p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    current_history JSONB;
    new_entry JSONB;
BEGIN
    -- Buscar histórico atual
    SELECT execution_history INTO current_history
    FROM ai_agent_actions
    WHERE id = p_action_id;
    
    -- Criar nova entrada
    new_entry := jsonb_build_object(
        'timestamp', NOW(),
        'contact_id', p_contact_id,
        'conversation_id', p_conversation_id,
        'input_data', p_input_data,
        'output_data', p_output_data,
        'success', p_success,
        'error_message', p_error_message
    );
    
    -- Adicionar ao histórico (manter apenas os últimos 100 registros)
    current_history := COALESCE(current_history, '[]'::jsonb);
    current_history := new_entry || current_history;
    
    -- Manter apenas os últimos 100 registros
    IF jsonb_array_length(current_history) > 100 THEN
        current_history := current_history - (jsonb_array_length(current_history) - 100);
    END IF;
    
    -- Atualizar histórico
    UPDATE ai_agent_actions
    SET execution_history = current_history
    WHERE id = p_action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários adicionais
COMMENT ON COLUMN ai_agent_actions.contact_id IS 'Referência opcional para contato específico';
COMMENT ON COLUMN ai_agent_actions.conversation_id IS 'Referência opcional para conversa específica';
COMMENT ON COLUMN ai_agent_actions.target_team_id IS 'Equipe de destino para ações de transferência';
COMMENT ON COLUMN ai_agent_actions.target_user_id IS 'Usuário de destino para ações de transferência';
COMMENT ON COLUMN ai_agent_actions.integration_config IS 'Configurações de integrações externas';
COMMENT ON COLUMN ai_agent_actions.custom_variables IS 'Variáveis customizadas para o estágio';
COMMENT ON COLUMN ai_agent_actions.chunking_config IS 'Configurações do sistema de chunking Redis/BullMQ';
COMMENT ON COLUMN ai_agent_actions.validation_rules IS 'Regras de validação para os dados coletados';
COMMENT ON COLUMN ai_agent_actions.execution_history IS 'Histórico de execuções do estágio';
COMMENT ON COLUMN ai_agent_actions.performance_metrics IS 'Métricas de performance do estágio';
