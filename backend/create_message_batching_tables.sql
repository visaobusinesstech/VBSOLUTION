-- Criar tabelas para sistema de batching de mensagens
-- Este script implementa o sistema de "picotar mensagens" com Redis

-- Tabela para armazenar batches de mensagens processados
CREATE TABLE IF NOT EXISTS public.whatsapp_message_batches (
    id TEXT PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chat_id TEXT NOT NULL,
    connection_id TEXT NOT NULL,
    message_count INTEGER NOT NULL DEFAULT 0,
    combined_content TEXT,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'processing', 'completed', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Adicionar colunas de batching na tabela whatsapp_mensagens
ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS batch_id TEXT,
ADD COLUMN IF NOT EXISTS batch_processed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS batch_sequence INTEGER; -- Ordem da mensagem no batch

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_batches_owner_id 
ON public.whatsapp_message_batches(owner_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_message_batches_chat_id 
ON public.whatsapp_message_batches(chat_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_message_batches_status 
ON public.whatsapp_message_batches(status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_message_batches_created_at 
ON public.whatsapp_message_batches(created_at);

CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_batch_id 
ON public.whatsapp_mensagens(batch_id) 
WHERE batch_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_batch_processed 
ON public.whatsapp_mensagens(batch_processed) 
WHERE batch_processed = true;

-- Tabela para configurações de batching por usuário/empresa
CREATE TABLE IF NOT EXISTS public.message_batching_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- Configurações de batching
    enabled BOOLEAN DEFAULT true,
    wait_time_seconds INTEGER DEFAULT 30,
    max_messages INTEGER DEFAULT 5,
    max_wait_time_seconds INTEGER DEFAULT 300, -- 5 minutos
    
    -- Configurações de processamento
    auto_process BOOLEAN DEFAULT true,
    combine_strategy TEXT DEFAULT 'sequential' CHECK (combine_strategy IN ('sequential', 'contextual', 'smart')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: apenas uma configuração por owner_id ou company_id
    CONSTRAINT unique_batching_config UNIQUE (owner_id, company_id)
);

-- Índices para configurações de batching
CREATE INDEX IF NOT EXISTS idx_message_batching_configs_owner_id 
ON public.message_batching_configs(owner_id);

CREATE INDEX IF NOT EXISTS idx_message_batching_configs_company_id 
ON public.message_batching_configs(company_id);

-- RLS para message_batching_configs
ALTER TABLE public.message_batching_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own batching configs" ON public.message_batching_configs
    FOR ALL USING (auth.uid() = owner_id);

-- RLS para whatsapp_message_batches
ALTER TABLE public.whatsapp_message_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own message batches" ON public.whatsapp_message_batches
    FOR SELECT USING (auth.uid() = owner_id);

-- Função para limpar batches expirados
CREATE OR REPLACE FUNCTION cleanup_expired_batches()
RETURNS void AS $$
BEGIN
    -- Marcar batches expirados
    UPDATE public.whatsapp_message_batches 
    SET status = 'expired'
    WHERE status = 'waiting' 
      AND created_at < NOW() - INTERVAL '1 hour';
    
    -- Log da limpeza
    RAISE NOTICE 'Batches expirados marcados: %', ROW_COUNT;
END;
$$ LANGUAGE plpgsql;

-- Função para obter estatísticas de batching
CREATE OR REPLACE FUNCTION get_batching_stats(p_owner_id UUID)
RETURNS TABLE (
    active_batches INTEGER,
    total_processed INTEGER,
    average_batch_size NUMERIC,
    total_messages_batched INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(active.active_batches, 0)::INTEGER as active_batches,
        COALESCE(processed.total_processed, 0)::INTEGER as total_processed,
        COALESCE(processed.avg_size, 0)::NUMERIC as average_batch_size,
        COALESCE(processed.total_messages, 0)::INTEGER as total_messages_batched
    FROM (
        SELECT COUNT(*) as active_batches
        FROM public.whatsapp_message_batches 
        WHERE owner_id = p_owner_id 
          AND status = 'waiting'
    ) active
    CROSS JOIN (
        SELECT 
            COUNT(*) as total_processed,
            AVG(message_count) as avg_size,
            SUM(message_count) as total_messages
        FROM public.whatsapp_message_batches 
        WHERE owner_id = p_owner_id 
          AND status = 'completed'
    ) processed;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE public.whatsapp_message_batches IS 'Armazena batches de mensagens processados pelo sistema de batching';
COMMENT ON TABLE public.message_batching_configs IS 'Configurações de batching por usuário/empresa';

COMMENT ON COLUMN public.whatsapp_message_batches.combined_content IS 'Conteúdo combinado de todas as mensagens do batch';
COMMENT ON COLUMN public.whatsapp_message_batches.message_count IS 'Número de mensagens no batch';
COMMENT ON COLUMN public.whatsapp_message_batches.status IS 'Status do batch: waiting, processing, completed, expired';

COMMENT ON COLUMN public.message_batching_configs.wait_time_seconds IS 'Tempo de espera em segundos antes de processar o batch';
COMMENT ON COLUMN public.message_batching_configs.max_messages IS 'Número máximo de mensagens por batch';
COMMENT ON COLUMN public.message_batching_configs.combine_strategy IS 'Estratégia de combinação: sequential, contextual, smart';

-- Inserir configuração padrão para usuários existentes
INSERT INTO public.message_batching_configs (owner_id, enabled, wait_time_seconds, max_messages, max_wait_time_seconds)
SELECT 
    id as owner_id,
    true as enabled,
    30 as wait_time_seconds,
    5 as max_messages,
    300 as max_wait_time_seconds
FROM auth.users
WHERE id NOT IN (SELECT owner_id FROM public.message_batching_configs)
ON CONFLICT (owner_id, company_id) DO NOTHING;

-- Verificar se as tabelas foram criadas corretamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('whatsapp_message_batches', 'message_batching_configs')
ORDER BY table_name, column_name;
