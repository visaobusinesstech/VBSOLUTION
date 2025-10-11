-- Migração completa para o sistema AI Agent
-- Execute este arquivo para configurar todo o sistema

-- 1. Primeiro, criar as tabelas de suporte
\i supporting_tables_migration.sql

-- 2. Depois, criar a tabela principal de ações
\i ai_agent_actions.sql

-- 3. Executar as migrações das ações
\i ai_agent_actions_fixed_migrations.sql

-- 4. Executar as migrações da configuração
\i ai_agent_configs_migration.sql

-- 5. Criar a tabela de variáveis
\i ai_agent_variables.sql

-- 6. Inserir dados iniciais
INSERT INTO equipes (id, owner_id, nome, descricao, is_default, is_active) 
VALUES 
('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'Equipe Padrão', 'Equipe padrão do sistema', true, true),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'Suporte', 'Equipe de suporte técnico', false, true),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'Vendas', 'Equipe de vendas', false, true);

-- 7. Verificar se tudo foi criado corretamente
DO $$
BEGIN
    -- Verificar se as tabelas existem
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_agent_configs') THEN
        RAISE EXCEPTION 'Tabela ai_agent_configs não foi criada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_agent_actions') THEN
        RAISE EXCEPTION 'Tabela ai_agent_actions não foi criada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_agent_variables') THEN
        RAISE EXCEPTION 'Tabela ai_agent_variables não foi criada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contatos') THEN
        RAISE EXCEPTION 'Tabela contatos não foi criada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversas') THEN
        RAISE EXCEPTION 'Tabela conversas não foi criada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'equipes') THEN
        RAISE EXCEPTION 'Tabela equipes não foi criada';
    END IF;
    
    RAISE NOTICE 'Todas as tabelas foram criadas com sucesso!';
END $$;

-- 8. Criar view para facilitar consultas
CREATE OR REPLACE VIEW v_ai_agent_complete_config AS
SELECT 
    c.id as config_id,
    c.owner_id,
    c.name as config_name,
    c.description as config_description,
    c.personality as config_personality,
    c.openai_api_key,
    c.selected_model,
    c.temperature,
    c.max_tokens,
    c.chunking_config,
    c.integration_config,
    c.variables_config,
    c.actions_config,
    c.test_config,
    c.usage_metrics,
    c.validation_status,
    c.validation_message,
    c.security_config,
    c.is_active as config_active,
    c.created_at as config_created_at,
    c.updated_at as config_updated_at,
    
    -- Contar ações
    (SELECT COUNT(*) FROM ai_agent_actions a WHERE a.ai_agent_config_id = c.id) as total_actions,
    (SELECT COUNT(*) FROM ai_agent_actions a WHERE a.ai_agent_config_id = c.id AND a.is_active = true) as active_actions,
    
    -- Contar variáveis
    (SELECT COUNT(*) FROM ai_agent_variables v WHERE v.ai_agent_config_id = c.id) as total_variables,
    (SELECT COUNT(*) FROM ai_agent_variables v WHERE v.ai_agent_config_id = c.id AND v.is_active = true) as active_variables,
    
    -- Contar conversas
    (SELECT COUNT(*) FROM conversas conv WHERE conv.ai_agent_config_id = c.id) as total_conversations,
    (SELECT COUNT(*) FROM conversas conv WHERE conv.ai_agent_config_id = c.id AND conv.is_active = true) as active_conversations
    
FROM ai_agent_configs c;

-- 9. Criar função para obter configuração completa
CREATE OR REPLACE FUNCTION get_complete_ai_agent_config(p_config_id UUID)
RETURNS JSONB AS $$
DECLARE
    config_record RECORD;
    actions JSONB;
    variables JSONB;
    result JSONB;
BEGIN
    -- Buscar configuração
    SELECT * INTO config_record
    FROM v_ai_agent_complete_config
    WHERE config_id = p_config_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Configuração não encontrada');
    END IF;
    
    -- Buscar ações
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', a.id,
            'name', a.name,
            'condition', a.condition,
            'instruction_prompt', a.instruction_prompt,
            'collect_data', a.collect_data,
            'action', a.action,
            'action_config', a.action_config,
            'final_instructions', a.final_instructions,
            'follow_up_timeout', a.follow_up_timeout,
            'follow_up_action', a.follow_up_action,
            'is_active', a.is_active,
            'execution_order', a.execution_order,
            'chunking_config', a.chunking_config,
            'performance_metrics', a.performance_metrics
        )
    ) INTO actions
    FROM ai_agent_actions a
    WHERE a.ai_agent_config_id = p_config_id
    AND a.is_active = true
    ORDER BY a.execution_order ASC;
    
    -- Buscar variáveis
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', v.id,
            'name', v.name,
            'display_name', v.display_name,
            'description', v.description,
            'variable_type', v.variable_type,
            'is_required', v.is_required,
            'validation_rules', v.validation_rules,
            'default_value', v.default_value,
            'placeholder_text', v.placeholder_text,
            'collection_prompt', v.collection_prompt,
            'collection_order', v.collection_order,
            'is_active', v.is_active
        )
    ) INTO variables
    FROM ai_agent_variables v
    WHERE v.ai_agent_config_id = p_config_id
    AND v.is_active = true
    ORDER BY v.collection_order ASC;
    
    -- Construir resultado
    result := jsonb_build_object(
        'config', to_jsonb(config_record),
        'actions', COALESCE(actions, '[]'::jsonb),
        'variables', COALESCE(variables, '[]'::jsonb),
        'generated_at', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Comentários finais
COMMENT ON VIEW v_ai_agent_complete_config IS 'View completa com configuração do AI Agent e estatísticas';
COMMENT ON FUNCTION get_complete_ai_agent_config IS 'Função para obter configuração completa do AI Agent com ações e variáveis';

-- 11. Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRAÇÃO COMPLETA EXECUTADA COM SUCESSO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tabelas criadas:';
    RAISE NOTICE '- ai_agent_configs (configurações do agente)';
    RAISE NOTICE '- ai_agent_actions (ações/estágios do agente)';
    RAISE NOTICE '- ai_agent_variables (variáveis do sistema)';
    RAISE NOTICE '- contatos (contatos do sistema)';
    RAISE NOTICE '- conversas (conversas do agente)';
    RAISE NOTICE '- equipes (equipes para transferência)';
    RAISE NOTICE '- equipe_membros (membros das equipes)';
    RAISE NOTICE '';
    RAISE NOTICE 'Views criadas:';
    RAISE NOTICE '- v_ai_agent_complete_config';
    RAISE NOTICE '';
    RAISE NOTICE 'Funções criadas:';
    RAISE NOTICE '- get_complete_ai_agent_config()';
    RAISE NOTICE '- validate_ai_agent_config()';
    RAISE NOTICE '- update_ai_agent_usage_metrics()';
    RAISE NOTICE '- get_active_ai_agent_actions()';
    RAISE NOTICE '- update_ai_agent_action_metrics()';
    RAISE NOTICE '- log_ai_agent_action_execution()';
    RAISE NOTICE '- get_ai_agent_action_stats()';
    RAISE NOTICE '';
    RAISE NOTICE 'Sistema pronto para uso!';
    RAISE NOTICE '========================================';
END $$;
