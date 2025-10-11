-- Adicionar campo attendance_type à tabela whatsapp_sessions
ALTER TABLE public.whatsapp_sessions 
ADD COLUMN IF NOT EXISTS attendance_type TEXT DEFAULT 'human' CHECK (attendance_type IN ('ai', 'human'));

-- Comentário para documentação
COMMENT ON COLUMN public.whatsapp_sessions.attendance_type IS 'Tipo de atendimento: ai (Agente IA) ou human (Atendimento Humano)';

-- Atualizar sessões existentes para 'human' por padrão
UPDATE public.whatsapp_sessions 
SET attendance_type = 'human' 
WHERE attendance_type IS NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_attendance_type ON public.whatsapp_sessions(attendance_type);

