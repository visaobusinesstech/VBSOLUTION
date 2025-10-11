-- Índices otimizados para WhatsApp V2
-- Execute estes comandos no Supabase SQL Editor

-- Índices para whatsapp_sessions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_sessions_owner_id 
ON public.whatsapp_sessions (owner_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_sessions_status 
ON public.whatsapp_sessions (status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_sessions_updated_at 
ON public.whatsapp_sessions (updated_at DESC);

-- Índices para whatsapp_atendimentos
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_atendimentos_owner_id 
ON public.whatsapp_atendimentos (owner_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_atendimentos_company_id 
ON public.whatsapp_atendimentos (company_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_atendimentos_status 
ON public.whatsapp_atendimentos (status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_atendimentos_ultima_mensagem 
ON public.whatsapp_atendimentos (ultima_mensagem DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_atendimentos_numero_cliente 
ON public.whatsapp_atendimentos (numero_cliente);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_atendimentos_atendente_id 
ON public.whatsapp_atendimentos (atendente_id);

-- Índices para whatsapp_mensagens
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_mensagens_owner_id 
ON public.whatsapp_mensagens (owner_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_mensagens_atendimento_id 
ON public.whatsapp_mensagens (atendimento_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_mensagens_timestamp 
ON public.whatsapp_mensagens (timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_mensagens_remetente 
ON public.whatsapp_mensagens (remetente);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_mensagens_lida 
ON public.whatsapp_mensagens (lida);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_mensagens_tipo 
ON public.whatsapp_mensagens (tipo);

-- Índices para whatsapp_configuracoes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_configuracoes_owner_id 
ON public.whatsapp_configuracoes (owner_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_configuracoes_company_id 
ON public.whatsapp_configuracoes (company_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_configuracoes_ativo 
ON public.whatsapp_configuracoes (ativo);

-- Índices compostos para consultas frequentes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_atendimentos_owner_status 
ON public.whatsapp_atendimentos (owner_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_atendimentos_owner_ultima_mensagem 
ON public.whatsapp_atendimentos (owner_id, ultima_mensagem DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_mensagens_atendimento_timestamp 
ON public.whatsapp_mensagens (atendimento_id, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_mensagens_owner_remetente_lida 
ON public.whatsapp_mensagens (owner_id, remetente, lida);

-- Índices para filtros específicos do WhatsApp
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_atendimentos_canal 
ON public.whatsapp_atendimentos (canal);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_atendimentos_prioridade 
ON public.whatsapp_atendimentos (prioridade);

-- Índices para realtime e performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_sessions_owner_updated 
ON public.whatsapp_sessions (owner_id, updated_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_mensagens_owner_created 
ON public.whatsapp_mensagens (owner_id, created_at DESC);

-- Comentários para documentação
COMMENT ON INDEX idx_whatsapp_sessions_owner_id IS 'Índice para buscar sessões por owner_id';
COMMENT ON INDEX idx_whatsapp_atendimentos_ultima_mensagem IS 'Índice para ordenar atendimentos por última mensagem';
COMMENT ON INDEX idx_whatsapp_mensagens_atendimento_timestamp IS 'Índice para buscar mensagens de um atendimento ordenadas por timestamp';
COMMENT ON INDEX idx_whatsapp_atendimentos_owner_status IS 'Índice composto para buscar atendimentos por owner e status';
