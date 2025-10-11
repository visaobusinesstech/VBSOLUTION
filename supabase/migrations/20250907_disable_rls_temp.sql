-- Função temporária para desabilitar RLS
CREATE OR REPLACE FUNCTION disable_rls_temp()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  ALTER TABLE public.whatsapp_atendimentos DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.whatsapp_mensagens DISABLE ROW LEVEL SECURITY;
END;
$$;

-- Executar a função
SELECT disable_rls_temp();
