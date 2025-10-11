-- Adicionar configurações de transcrição de áudios na tabela ai_agent_configs
-- Este script adiciona controles para o usuário habilitar/desabilitar a transcrição de áudios

-- Adicionar colunas para configurações de áudio
ALTER TABLE public.ai_agent_configs 
ADD COLUMN IF NOT EXISTS audio_transcription_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS audio_transcription_language TEXT DEFAULT 'pt-BR',
ADD COLUMN IF NOT EXISTS audio_transcription_provider TEXT DEFAULT 'openai' CHECK (audio_transcription_provider IN ('openai', 'disabled')),
ADD COLUMN IF NOT EXISTS audio_transcription_model TEXT DEFAULT 'whisper-1',
ADD COLUMN IF NOT EXISTS audio_transcription_auto_save BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS audio_transcription_max_duration INTEGER DEFAULT 300, -- 5 minutos em segundos
ADD COLUMN IF NOT EXISTS audio_transcription_fallback_text TEXT DEFAULT '[Áudio recebido]';

-- Criar índice para melhorar performance nas consultas de configuração de áudio
CREATE INDEX IF NOT EXISTS idx_ai_agent_configs_audio_enabled 
ON public.ai_agent_configs(audio_transcription_enabled) 
WHERE audio_transcription_enabled = true;

-- Comentários para documentação
COMMENT ON COLUMN public.ai_agent_configs.audio_transcription_enabled IS 'Habilita/desabilita a transcrição automática de áudios';
COMMENT ON COLUMN public.ai_agent_configs.audio_transcription_language IS 'Idioma para transcrição (pt-BR, en-US, es-ES, etc.)';
COMMENT ON COLUMN public.ai_agent_configs.audio_transcription_provider IS 'Provedor de transcrição: openai ou disabled';
COMMENT ON COLUMN public.ai_agent_configs.audio_transcription_model IS 'Modelo de transcrição (whisper-1, etc.)';
COMMENT ON COLUMN public.ai_agent_configs.audio_transcription_auto_save IS 'Salva automaticamente a transcrição na coluna conteudo';
COMMENT ON COLUMN public.ai_agent_configs.audio_transcription_max_duration IS 'Duração máxima do áudio para transcrição (em segundos)';
COMMENT ON COLUMN public.ai_agent_configs.audio_transcription_fallback_text IS 'Texto exibido quando a transcrição falha';

-- Atualizar configurações existentes para ter valores padrão
UPDATE public.ai_agent_configs 
SET 
  audio_transcription_enabled = false,
  audio_transcription_language = 'pt-BR',
  audio_transcription_provider = 'openai',
  audio_transcription_model = 'whisper-1',
  audio_transcription_auto_save = true,
  audio_transcription_max_duration = 300,
  audio_transcription_fallback_text = '[Áudio recebido]'
WHERE audio_transcription_enabled IS NULL;

-- Verificar se as colunas foram criadas corretamente
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'ai_agent_configs' 
  AND column_name LIKE 'audio_transcription%'
ORDER BY column_name;
