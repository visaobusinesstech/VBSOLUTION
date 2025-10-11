-- Create WhatsApp tables without storage bucket issues
-- This creates the essential tables for WhatsApp functionality

-- Create whatsapp_atendimentos table
CREATE TABLE IF NOT EXISTS public.whatsapp_atendimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  company_id UUID,
  connection_id TEXT,
  chat_id TEXT NOT NULL,
  numero_cliente TEXT NOT NULL,
  nome_cliente TEXT,
  status TEXT DEFAULT 'active',
  ultima_mensagem_preview TEXT,
  ultima_mensagem_em TIMESTAMPTZ,
  nao_lidas INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create whatsapp_mensagens table
CREATE TABLE IF NOT EXISTS public.whatsapp_mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  atendimento_id UUID NOT NULL REFERENCES public.whatsapp_atendimentos(id) ON DELETE CASCADE,
  connection_id TEXT,
  chat_id TEXT,
  remetente TEXT NOT NULL CHECK (remetente IN ('CLIENTE', 'ATENDENTE')),
  tipo TEXT NOT NULL CHECK (tipo IN ('TEXTO', 'IMAGEM', 'AUDIO', 'VIDEO', 'DOCUMENTO', 'STICKER', 'LOCALIZACAO', 'CONTATO', 'OUTRO')),
  conteudo TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  lida BOOLEAN DEFAULT FALSE,
  midia_url TEXT,
  midia_tipo TEXT,
  midia_nome TEXT,
  midia_tamanho INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wa_atend_owner ON public.whatsapp_atendimentos(owner_id);
CREATE INDEX IF NOT EXISTS idx_wa_atend_conn ON public.whatsapp_atendimentos(connection_id);
CREATE INDEX IF NOT EXISTS idx_wa_atend_chat ON public.whatsapp_atendimentos(chat_id);
CREATE INDEX IF NOT EXISTS idx_wa_atend_last_msg ON public.whatsapp_atendimentos(ultima_mensagem_em DESC);

CREATE INDEX IF NOT EXISTS idx_wa_msg_atendimento ON public.whatsapp_mensagens(atendimento_id);
CREATE INDEX IF NOT EXISTS idx_wa_msg_owner ON public.whatsapp_mensagens(owner_id);
CREATE INDEX IF NOT EXISTS idx_wa_msg_created ON public.whatsapp_mensagens(created_at DESC);

-- Create unique constraint for conversations
CREATE UNIQUE INDEX IF NOT EXISTS uq_wa_atend_owner_conn_num 
ON public.whatsapp_atendimentos (owner_id, connection_id, numero_cliente);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_atendimentos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_mensagens;

-- Insert test data
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
  nao_lidas
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
  1
) ON CONFLICT (id) DO NOTHING;

-- Insert test messages
INSERT INTO public.whatsapp_mensagens (
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
