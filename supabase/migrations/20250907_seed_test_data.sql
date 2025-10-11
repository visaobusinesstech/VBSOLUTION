-- Seed test data for WhatsApp conversations and messages
-- This will help us test the message flow

-- Insert test conversation
INSERT INTO public.whatsapp_atendimentos (
  id, 
  owner_id, 
  connection_id, 
  chat_id, 
  numero_cliente, 
  nome_cliente, 
  status,
  ultima_mensagem_preview, 
  ultima_mensagem_em, 
  nao_lidas,
  created_at,
  updated_at
) VALUES (
  'f8451154-cea5-43a3-8f75-d64c07056e04',
  'f8451154-cea5-43a3-8f75-d64c07056e04',
  'gui-teste',
  '5585999999999@s.whatsapp.net',
  '5585999999999@s.whatsapp.net',
  'Tester',
  'active',
  'Olá! Como posso ajudar?',
  NOW(),
  1,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert test messages
INSERT INTO public.whatsapp_mensagens (
  id,
  owner_id,
  atendimento_id,
  connection_id,
  chat_id,
  remetente,
  tipo,
  conteudo,
  created_at,
  lida
) VALUES 
  (
    gen_random_uuid(),
    'f8451154-cea5-43a3-8f75-d64c07056e04',
    'f8451154-cea5-43a3-8f75-d64c07056e04',
    'gui-teste',
    '5585999999999@s.whatsapp.net',
    'CLIENTE',
    'TEXTO',
    'Olá! Preciso de ajuda com meu pedido.',
    NOW() - INTERVAL '2 hours',
    false
  ),
  (
    gen_random_uuid(),
    'f8451154-cea5-43a3-8f75-d64c07056e04',
    'f8451154-cea5-43a3-8f75-d64c07056e04',
    'gui-teste',
    '5585999999999@s.whatsapp.net',
    'ATENDENTE',
    'TEXTO',
    'Olá! Como posso ajudar?',
    NOW() - INTERVAL '1 hour',
    true
  ),
  (
    gen_random_uuid(),
    'f8451154-cea5-43a3-8f75-d64c07056e04',
    'f8451154-cea5-43a3-8f75-d64c07056e04',
    'gui-teste',
    '5585999999999@s.whatsapp.net',
    'CLIENTE',
    'TEXTO',
    'Meu pedido #12345 não chegou ainda.',
    NOW() - INTERVAL '30 minutes',
    false
  );

-- Enable Realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_atendimentos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_mensagens;
