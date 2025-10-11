-- Script para adicionar configurações de modo de atendimento
-- Este script adiciona as colunas necessárias para controlar o modo de atendimento

-- =====================================================
-- 1. ADICIONAR CAMPO DE MODO DE ATENDIMENTO GLOBAL POR CONEXÃO
-- =====================================================

-- Adicionar campo attendance_type à tabela whatsapp_sessions (configuração global por conexão)
ALTER TABLE public.whatsapp_sessions 
ADD COLUMN IF NOT EXISTS attendance_type TEXT DEFAULT 'human' CHECK (attendance_type IN ('ai', 'human'));

-- Comentário para documentação
COMMENT ON COLUMN public.whatsapp_sessions.attendance_type IS 'Tipo de atendimento global para esta conexão: ai (Agente IA) ou human (Atendimento Humano)';

-- Atualizar sessões existentes para 'human' por padrão
UPDATE public.whatsapp_sessions 
SET attendance_type = 'human' 
WHERE attendance_type IS NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_attendance_type ON public.whatsapp_sessions(attendance_type);

-- =====================================================
-- 2. ADICIONAR CAMPO DE MODO DE ATENDIMENTO POR CONVERSA
-- =====================================================

-- Adicionar campo attendance_mode à tabela whatsapp_atendimentos (configuração por conversa)
ALTER TABLE public.whatsapp_atendimentos 
ADD COLUMN IF NOT EXISTS attendance_mode TEXT DEFAULT NULL CHECK (attendance_mode IN ('ai', 'human') OR attendance_mode IS NULL);

-- Comentário para documentação
COMMENT ON COLUMN public.whatsapp_atendimentos.attendance_mode IS 'Modo de atendimento específico para esta conversa: ai (Agente IA), human (Atendimento Humano) ou NULL (usa configuração global)';

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_atendimentos_attendance_mode ON public.whatsapp_atendimentos(attendance_mode);

-- =====================================================
-- 3. ATUALIZAR TABELA DE MENSAGENS PARA SUPORTAR AI
-- =====================================================

-- Modificar constraint da tabela whatsapp_mensagens para incluir 'AI' como remetente
ALTER TABLE public.whatsapp_mensagens 
DROP CONSTRAINT IF EXISTS whatsapp_mensagens_remetente_check;

ALTER TABLE public.whatsapp_mensagens 
ADD CONSTRAINT whatsapp_mensagens_remetente_check 
CHECK (remetente IN ('CLIENTE', 'ATENDENTE', 'AI'));

-- Comentário para documentação
COMMENT ON COLUMN public.whatsapp_mensagens.remetente IS 'Remetente da mensagem: CLIENTE, ATENDENTE (manual) ou AI (agente artificial)';

-- =====================================================
-- 4. CRIAR TABELA DE CONFIGURAÇÕES DE AI AGENT (OPCIONAL)
-- =====================================================

-- Criar tabela para configurações específicas do AI Agent por conexão
CREATE TABLE IF NOT EXISTS public.ai_agent_connection_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  connection_id TEXT NOT NULL,
  ai_agent_config_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint única por owner_id e connection_id
  CONSTRAINT unique_owner_connection_config UNIQUE (owner_id, connection_id)
);

-- Comentários para documentação
COMMENT ON TABLE public.ai_agent_connection_configs IS 'Configurações específicas do AI Agent por conexão';
COMMENT ON COLUMN public.ai_agent_connection_configs.owner_id IS 'ID do usuário proprietário';
COMMENT ON COLUMN public.ai_agent_connection_configs.connection_id IS 'ID da conexão WhatsApp';
COMMENT ON COLUMN public.ai_agent_connection_configs.ai_agent_config_id IS 'ID da configuração do AI Agent';
COMMENT ON COLUMN public.ai_agent_connection_configs.is_active IS 'Se a configuração está ativa';

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_ai_agent_conn_configs_owner ON public.ai_agent_connection_configs(owner_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_conn_configs_connection ON public.ai_agent_connection_configs(connection_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_conn_configs_active ON public.ai_agent_connection_configs(is_active);

-- =====================================================
-- 5. FUNÇÃO AUXILIAR PARA DETERMINAR MODO DE ATENDIMENTO
-- =====================================================

-- Função para determinar qual modo de atendimento usar para uma conversa
CREATE OR REPLACE FUNCTION get_attendance_mode_for_conversation(
  p_owner_id UUID,
  p_connection_id TEXT,
  p_atendimento_id UUID DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
  conversation_mode TEXT;
  global_mode TEXT;
  final_mode TEXT;
BEGIN
  -- Se temos um atendimento específico, verificar se tem configuração própria
  IF p_atendimento_id IS NOT NULL THEN
    SELECT attendance_mode INTO conversation_mode
    FROM public.whatsapp_atendimentos
    WHERE id = p_atendimento_id AND owner_id = p_owner_id;
    
    -- Se a conversa tem configuração específica, usar ela
    IF conversation_mode IS NOT NULL THEN
      RETURN conversation_mode;
    END IF;
  END IF;
  
  -- Caso contrário, usar configuração global da conexão
  SELECT attendance_type INTO global_mode
  FROM public.whatsapp_sessions
  WHERE owner_id = p_owner_id AND connection_id = p_connection_id;
  
  -- Retornar modo global ou 'human' como fallback
  RETURN COALESCE(global_mode, 'human');
END;
$$ LANGUAGE plpgsql;

-- Comentário da função
COMMENT ON FUNCTION get_attendance_mode_for_conversation IS 'Determina qual modo de atendimento usar: conversa específica ou configuração global da conexão';

-- =====================================================
-- 6. TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_ai_agent_connection_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS trigger_update_ai_agent_connection_configs_updated_at ON public.ai_agent_connection_configs;
CREATE TRIGGER trigger_update_ai_agent_connection_configs_updated_at
    BEFORE UPDATE ON public.ai_agent_connection_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_agent_connection_configs_updated_at();

-- =====================================================
-- 7. RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS na nova tabela
ALTER TABLE public.ai_agent_connection_configs ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas suas próprias configurações
CREATE POLICY IF NOT EXISTS ai_agent_connection_configs_owner_policy ON public.ai_agent_connection_configs
    FOR ALL USING (owner_id = auth.uid()::text::uuid);

-- =====================================================
-- 8. DADOS DE EXEMPLO (OPCIONAL)
-- =====================================================

-- Inserir configuração de exemplo (descomente se necessário)
/*
INSERT INTO public.ai_agent_connection_configs (owner_id, connection_id, is_active)
SELECT 
  owner_id, 
  connection_id, 
  true
FROM public.whatsapp_sessions 
WHERE attendance_type = 'ai'
ON CONFLICT (owner_id, connection_id) DO NOTHING;
*/

-- =====================================================
-- 9. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se as colunas foram adicionadas corretamente
SELECT 
    'whatsapp_sessions' as table_name,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'whatsapp_sessions' 
  AND column_name = 'attendance_type'

UNION ALL

SELECT 
    'whatsapp_atendimentos' as table_name,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'whatsapp_atendimentos' 
  AND column_name = 'attendance_mode'

UNION ALL

SELECT 
    'whatsapp_mensagens' as table_name,
    constraint_name, 
    'constraint' as data_type, 
    'NO' as is_nullable, 
    constraint_definition as column_default
FROM information_schema.check_constraints 
WHERE constraint_name = 'whatsapp_mensagens_remetente_check';

-- Mostrar informações da nova tabela
SELECT 
    'ai_agent_connection_configs' as table_name,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'ai_agent_connection_configs' 
ORDER BY ordinal_position;
