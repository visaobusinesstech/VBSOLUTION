-- RLS para conversas: usuário pode ler apenas suas próprias
CREATE POLICY "read_own_atendimentos"
ON public.whatsapp_atendimentos
FOR SELECT
USING ( owner_id = auth.uid() );

-- RLS para mensagens: usuário pode ler mensagens apenas de suas conversas
CREATE POLICY "read_own_mensagens"
ON public.whatsapp_mensagens
FOR SELECT
USING ( owner_id = auth.uid() );

-- Habilitar RLS nas tabelas
ALTER TABLE public.whatsapp_atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_mensagens ENABLE ROW LEVEL SECURITY;
