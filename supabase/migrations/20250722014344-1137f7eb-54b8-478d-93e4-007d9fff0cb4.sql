
-- Criar tabela para conversas
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'direct', -- 'direct' ou 'group'
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para participantes das conversas
CREATE TABLE public.conversation_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Criar tabela para mensagens
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  content TEXT,
  message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'image', 'file'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para anexos de mensagens
CREATE TABLE public.message_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para perfis de usuários (para nome e avatar)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para conversas
CREATE POLICY "Users can view conversations they participate in" 
  ON public.conversations FOR SELECT 
  USING (
    id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations" 
  ON public.conversations FOR INSERT 
  WITH CHECK (created_by = auth.uid());

-- Políticas para participantes
CREATE POLICY "Users can view participants of their conversations" 
  ON public.conversation_participants FOR SELECT 
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add participants to conversations they created" 
  ON public.conversation_participants FOR INSERT 
  WITH CHECK (
    conversation_id IN (
      SELECT id 
      FROM public.conversations 
      WHERE created_by = auth.uid()
    )
  );

-- Políticas para mensagens
CREATE POLICY "Users can view messages from their conversations" 
  ON public.messages FOR SELECT 
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their conversations" 
  ON public.messages FOR INSERT 
  WITH CHECK (
    sender_id = auth.uid() AND 
    conversation_id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Políticas para anexos
CREATE POLICY "Users can view attachments from their conversations" 
  ON public.message_attachments FOR SELECT 
  USING (
    message_id IN (
      SELECT m.id 
      FROM public.messages m
      JOIN public.conversation_participants cp ON m.conversation_id = cp.conversation_id
      WHERE cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload attachments to their messages" 
  ON public.message_attachments FOR INSERT 
  WITH CHECK (
    message_id IN (
      SELECT m.id 
      FROM public.messages m
      WHERE m.sender_id = auth.uid()
    )
  );

-- Políticas para perfis
CREATE POLICY "Users can view all profiles" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (id = auth.uid());

-- Criar bucket para anexos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('message-attachments', 'message-attachments', true);

-- Política para upload de arquivos
CREATE POLICY "Users can upload their own attachments" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'message-attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para visualizar arquivos
CREATE POLICY "Users can view message attachments" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'message-attachments');

-- Adicionar trigger para atualizar updated_at
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir alguns dados de exemplo
INSERT INTO public.profiles (id, name, avatar_url) VALUES
  ('00000000-0000-0000-0000-000000000001', 'João Silva', '/placeholder.svg'),
  ('00000000-0000-0000-0000-000000000002', 'Maria Santos', '/placeholder.svg'),
  ('00000000-0000-0000-0000-000000000003', 'Pedro Costa', '/placeholder.svg');

INSERT INTO public.conversations (id, name, type, created_by) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Equipe Vendas', 'group', '00000000-0000-0000-0000-000000000001'),
  ('22222222-2222-2222-2222-222222222222', 'João Silva', 'direct', '00000000-0000-0000-0000-000000000001'),
  ('33333333-3333-3333-3333-333333333333', 'Maria Santos', 'direct', '00000000-0000-0000-0000-000000000001');

INSERT INTO public.conversation_participants (conversation_id, user_id) VALUES
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001'),
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002'),
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000003'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000002'),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001'),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000003');

INSERT INTO public.messages (conversation_id, sender_id, content, message_type) VALUES
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', 'Vamos revisar os números da semana?', 'text'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000002', 'O relatório está pronto', 'text'),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000003', 'Preciso da sua aprovação', 'text');
