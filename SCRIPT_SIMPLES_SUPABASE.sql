-- SCRIPT SIMPLES PARA CRIAR AS TABELAS DO FEED
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela feed
CREATE TABLE IF NOT EXISTS public.feed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('text', 'image', 'video', 'event')),
  content TEXT,
  media_url TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Criar tabela feed_likes
CREATE TABLE IF NOT EXISTS public.feed_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feed_id UUID NOT NULL REFERENCES public.feed(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(feed_id, user_id)
);

-- 3. Criar tabela feed_comments
CREATE TABLE IF NOT EXISTS public.feed_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feed_id UUID NOT NULL REFERENCES public.feed(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Habilitar RLS
ALTER TABLE public.feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;

-- 5. Políticas básicas para feed
CREATE POLICY "Users can view all feed posts" ON public.feed
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own feed posts" ON public.feed
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feed posts" ON public.feed
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Políticas básicas para feed_likes
CREATE POLICY "Users can view all likes" ON public.feed_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own likes" ON public.feed_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON public.feed_likes
  FOR DELETE USING (auth.uid() = user_id);

-- 7. Políticas básicas para feed_comments
CREATE POLICY "Users can view all comments" ON public.feed_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comments" ON public.feed_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.feed_comments
  FOR DELETE USING (auth.uid() = user_id);

-- 8. Criar bucket para mídia
INSERT INTO storage.buckets (id, name, public) 
VALUES ('feed-media', 'feed-media', true)
ON CONFLICT (id) DO NOTHING;

-- 9. Políticas para storage
CREATE POLICY "Users can upload feed media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'feed-media');

CREATE POLICY "Users can view feed media" ON storage.objects
  FOR SELECT USING (bucket_id = 'feed-media');

CREATE POLICY "Users can delete their own feed media" ON storage.objects
  FOR DELETE USING (bucket_id = 'feed-media');
