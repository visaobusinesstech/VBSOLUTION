-- Desabilitar RLS temporariamente para teste
-- ATENÇÃO: Use apenas para desenvolvimento!

-- Desabilitar RLS nas tabelas WhatsApp
ALTER TABLE public.whatsapp_atendimentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_mensagens DISABLE ROW LEVEL SECURITY;

-- Garantir permissões
GRANT ALL ON public.whatsapp_atendimentos TO authenticated;
GRANT ALL ON public.whatsapp_mensagens TO authenticated;
GRANT ALL ON public.whatsapp_atendimentos TO anon;
GRANT ALL ON public.whatsapp_mensagens TO anon;

-- Inserir dados de teste
INSERT INTO public.whatsapp_atendimentos (
    id,
    owner_id,
    numero_cliente,
    nome_cliente,
    status,
    ultima_mensagem,
    ultima_mensagem_at,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    '5511999999999',
    'Cliente Teste',
    'aguardando',
    'Olá! Como posso ajudar?',
    now(),
    now(),
    now()
) ON CONFLICT DO NOTHING;

-- Inserir mensagem de teste
INSERT INTO public.whatsapp_mensagens (
    id,
    owner_id,
    atendimento_id,
    conteudo,
    tipo,
    direcao,
    timestamp,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    (SELECT id FROM public.whatsapp_atendimentos LIMIT 1),
    'Esta é uma mensagem de teste do sistema VBSolutionCRM',
    'TEXTO',
    'ENTRADA',
    now(),
    now(),
    now()
) ON CONFLICT DO NOTHING;
