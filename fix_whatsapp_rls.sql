-- Fix WhatsApp RLS Policies
-- Enable RLS on WhatsApp tables
ALTER TABLE public.whatsapp_atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_mensagens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Usuários podem ver e editar atendimentos de suas empresas" ON public.whatsapp_atendimentos;
DROP POLICY IF EXISTS "Usuários podem ver e editar mensagens de suas empresas" ON public.whatsapp_mensagens;

-- Create new policies for WhatsApp tables
CREATE POLICY "whatsapp_atendimentos_policy" ON public.whatsapp_atendimentos
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "whatsapp_mensagens_policy" ON public.whatsapp_mensagens
  FOR ALL USING (auth.uid() = owner_id);

-- Grant necessary permissions
GRANT ALL ON public.whatsapp_atendimentos TO authenticated;
GRANT ALL ON public.whatsapp_mensagens TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
