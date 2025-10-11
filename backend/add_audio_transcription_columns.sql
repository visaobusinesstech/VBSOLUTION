-- Adicionar colunas para transcrição de áudios na tabela whatsapp_mensagens
-- Este script adiciona suporte completo à transcrição de áudios

-- Adicionar colunas para transcrição
ALTER TABLE public.whatsapp_mensagens 
ADD COLUMN IF NOT EXISTS transcription TEXT,
ADD COLUMN IF NOT EXISTS transcription_status TEXT DEFAULT 'pending' CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS transcription_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS transcription_duration INTEGER, -- duração em segundos
ADD COLUMN IF NOT EXISTS transcription_language TEXT DEFAULT 'pt-BR';

-- Criar índice para melhorar performance nas consultas de transcrição
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_transcription_status 
ON public.whatsapp_mensagens(transcription_status) 
WHERE transcription_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_audio_transcription 
ON public.whatsapp_mensagens(media_url, owner_id, message_type) 
WHERE message_type = 'AUDIO' AND media_url IS NOT NULL;

-- Atualizar mensagens de áudio existentes para ter status 'pending'
UPDATE public.whatsapp_mensagens 
SET transcription_status = 'pending'
WHERE message_type = 'AUDIO' 
  AND transcription_status IS NULL
  AND media_url IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.whatsapp_mensagens.transcription IS 'Texto transcrito do áudio usando OpenAI Whisper';
COMMENT ON COLUMN public.whatsapp_mensagens.transcription_status IS 'Status da transcrição: pending, processing, completed, failed';
COMMENT ON COLUMN public.whatsapp_mensagens.transcription_updated_at IS 'Timestamp da última atualização da transcrição';
COMMENT ON COLUMN public.whatsapp_mensagens.transcription_duration IS 'Duração do áudio em segundos';
COMMENT ON COLUMN public.whatsapp_mensagens.transcription_language IS 'Idioma detectado/definido para a transcrição';

-- RLS: Permitir que usuários vejam transcrições de suas próprias mensagens
-- (As políticas existentes já cobrem isso através do owner_id)

-- Verificar se as colunas foram criadas corretamente
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'whatsapp_mensagens' 
  AND column_name LIKE 'transcription%'
ORDER BY column_name;
