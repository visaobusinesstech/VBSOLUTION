-- Adicionar colunas para sistema de divisão de mensagens (chunking)
-- Este script adiciona suporte ao sistema de "picotar mensagens" em chunks de 200 caracteres

-- Adicionar colunas para chunking na tabela whatsapp_mensagens
ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS chunk_sequence INTEGER,
ADD COLUMN IF NOT EXISTS chunk_total INTEGER,
ADD COLUMN IF NOT EXISTS is_chunk BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS parent_message_id TEXT,
ADD COLUMN IF NOT EXISTS chunk_delay_ms INTEGER DEFAULT 1000;

-- Criar índices para performance nas consultas de chunks
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_chunk_sequence 
ON public.whatsapp_mensagens(chunk_sequence) 
WHERE chunk_sequence IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_is_chunk 
ON public.whatsapp_mensagens(is_chunk) 
WHERE is_chunk = true;

CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_parent_message_id 
ON public.whatsapp_mensagens(parent_message_id) 
WHERE parent_message_id IS NOT NULL;

-- Criar índice composto para consultas de chunks por conversa
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_chunks_by_chat 
ON public.whatsapp_mensagens(chat_id, chunk_sequence, timestamp) 
WHERE is_chunk = true;

-- Comentários para documentação
COMMENT ON COLUMN public.whatsapp_mensagens.chunk_sequence IS 'Sequência do chunk na mensagem dividida (1, 2, 3, etc.)';
COMMENT ON COLUMN public.whatsapp_mensagens.chunk_total IS 'Total de chunks na mensagem dividida';
COMMENT ON COLUMN public.whatsapp_mensagens.is_chunk IS 'Indica se esta mensagem é um chunk de uma mensagem maior';
COMMENT ON COLUMN public.whatsapp_mensagens.parent_message_id IS 'ID da mensagem original que foi dividida em chunks';
COMMENT ON COLUMN public.whatsapp_mensagens.chunk_delay_ms IS 'Delay em milissegundos antes de enviar este chunk';

-- Função para reconstruir mensagem original a partir dos chunks
CREATE OR REPLACE FUNCTION reconstruct_message_from_chunks(p_parent_message_id TEXT)
RETURNS TEXT AS $$
DECLARE
    reconstructed_text TEXT := '';
    chunk_record RECORD;
BEGIN
    -- Buscar todos os chunks ordenados por sequência
    FOR chunk_record IN
        SELECT conteudo, chunk_sequence
        FROM public.whatsapp_mensagens
        WHERE parent_message_id = p_parent_message_id
          AND is_chunk = true
        ORDER BY chunk_sequence
    LOOP
        -- Remover prefixo de sequência se existir
        DECLARE
            clean_content TEXT;
        BEGIN
            clean_content := chunk_record.conteudo;
            -- Remover padrão [1/3] do início da string
            clean_content := regexp_replace(clean_content, '^\[\d+/\d+\]\s*', '');
            reconstructed_text := reconstructed_text || clean_content || ' ';
        END;
    END LOOP;
    
    RETURN trim(reconstructed_text);
END;
$$ LANGUAGE plpgsql;

-- Função para obter estatísticas de chunking
CREATE OR REPLACE FUNCTION get_chunking_stats(p_owner_id UUID, p_days INTEGER DEFAULT 7)
RETURNS TABLE (
    total_messages INTEGER,
    chunked_messages INTEGER,
    total_chunks INTEGER,
    avg_chunks_per_message NUMERIC,
    avg_chunk_size NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_messages,
        COUNT(CASE WHEN is_chunk = false AND chunk_total > 1 THEN 1 END)::INTEGER as chunked_messages,
        COUNT(CASE WHEN is_chunk = true THEN 1 END)::INTEGER as total_chunks,
        ROUND(AVG(CASE WHEN is_chunk = false THEN chunk_total END), 2) as avg_chunks_per_message,
        ROUND(AVG(CASE WHEN is_chunk = true THEN LENGTH(conteudo) END), 2) as avg_chunk_size
    FROM public.whatsapp_mensagens
    WHERE owner_id = p_owner_id
      AND remetente = 'AI'
      AND timestamp >= NOW() - INTERVAL '1 day' * p_days;
END;
$$ LANGUAGE plpgsql;

-- Função para limpar chunks órfãos (sem parent_message_id válido)
CREATE OR REPLACE FUNCTION cleanup_orphaned_chunks()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Deletar chunks órfãos (is_chunk = true mas parent_message_id não existe)
    DELETE FROM public.whatsapp_mensagens
    WHERE is_chunk = true
      AND parent_message_id IS NOT NULL
      AND parent_message_id NOT IN (
          SELECT message_id 
          FROM public.whatsapp_mensagens 
          WHERE is_chunk = false
      );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Chunks órfãos removidos: %', deleted_count;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar chunks
CREATE OR REPLACE FUNCTION validate_chunk_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Se é um chunk, deve ter chunk_sequence e chunk_total
    IF NEW.is_chunk = true THEN
        IF NEW.chunk_sequence IS NULL OR NEW.chunk_total IS NULL THEN
            RAISE EXCEPTION 'Chunks devem ter chunk_sequence e chunk_total definidos';
        END IF;
        
        -- chunk_sequence deve estar entre 1 e chunk_total
        IF NEW.chunk_sequence < 1 OR NEW.chunk_sequence > NEW.chunk_total THEN
            RAISE EXCEPTION 'chunk_sequence deve estar entre 1 e chunk_total';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de validação
DROP TRIGGER IF EXISTS validate_chunk_trigger ON public.whatsapp_mensagens;
CREATE TRIGGER validate_chunk_trigger
    BEFORE INSERT OR UPDATE ON public.whatsapp_mensagens
    FOR EACH ROW
    EXECUTE FUNCTION validate_chunk_data();

-- Verificar se as colunas foram criadas corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'whatsapp_mensagens' 
  AND column_name LIKE 'chunk%'
ORDER BY column_name;