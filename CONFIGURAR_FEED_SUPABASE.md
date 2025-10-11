# 🔧 Configuração do Feed no Supabase

## ⚠️ Erro Atual
O erro "FeedPostCreator is not defined" ocorre porque as tabelas do feed ainda não foram criadas no Supabase.

## ✅ Solução

### 1. **Acesse o Supabase**
1. Vá para [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione seu projeto

### 2. **Execute o Script SQL**
1. No painel do Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Copie e cole o conteúdo do arquivo `create_feed_tables.sql`
4. Clique em **Run** para executar o script

### 3. **Verificar se foi criado**
Após executar o script, você deve ver as seguintes tabelas:
- ✅ `feed`
- ✅ `feed_likes` 
- ✅ `feed_comments`
- ✅ Bucket `feed-media` no Storage

### 4. **Recarregar a Página**
1. Volte para o seu CRM
2. Acesse `/feed`
3. A página deve carregar normalmente

## 🚀 Após a Configuração

Quando as tabelas estiverem criadas, o feed terá:
- ✅ Posts de texto, imagem, vídeo e eventos
- ✅ Sistema de curtidas
- ✅ Sistema de comentários
- ✅ Upload de mídia
- ✅ Interface moderna e responsiva

## 📋 Script SQL Completo

```sql
-- Execute este script no Supabase SQL Editor

-- 1. Criar tabela feed
CREATE TABLE IF NOT EXISTS public.feed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'event')),
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

-- 4. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_feed_user_id ON public.feed(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_created_at ON public.feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_type ON public.feed(type);
CREATE INDEX IF NOT EXISTS idx_feed_likes_feed_id ON public.feed_likes(feed_id);
CREATE INDEX IF NOT EXISTS idx_feed_likes_user_id ON public.feed_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_feed_id ON public.feed_comments(feed_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_created_at ON public.feed_comments(created_at ASC);

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE public.feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS para feed
CREATE POLICY "Users can view all feed posts" ON public.feed
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own feed posts" ON public.feed
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feed posts" ON public.feed
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feed posts" ON public.feed
  FOR DELETE USING (auth.uid() = user_id);

-- 7. Criar políticas RLS para feed_likes
CREATE POLICY "Users can view all likes" ON public.feed_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own likes" ON public.feed_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON public.feed_likes
  FOR DELETE USING (auth.uid() = user_id);

-- 8. Criar políticas RLS para feed_comments
CREATE POLICY "Users can view all comments" ON public.feed_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comments" ON public.feed_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.feed_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.feed_comments
  FOR DELETE USING (auth.uid() = user_id);

-- 9. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Criar triggers para updated_at
CREATE TRIGGER update_feed_updated_at 
  BEFORE UPDATE ON public.feed 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feed_comments_updated_at 
  BEFORE UPDATE ON public.feed_comments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Criar bucket para storage de mídia (se não existir)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('feed-media', 'feed-media', true)
ON CONFLICT (id) DO NOTHING;

-- 12. Criar política para storage
CREATE POLICY "Users can upload feed media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'feed-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view feed media" ON storage.objects
  FOR SELECT USING (bucket_id = 'feed-media');

CREATE POLICY "Users can delete their own feed media" ON storage.objects
  FOR DELETE USING (bucket_id = 'feed-media' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## ✅ Após Executar o Script

1. **Recarregue a página** `/feed` no seu CRM
2. O erro deve desaparecer
3. O feed estará funcionando completamente

## 🆘 Se Ainda Houver Problemas

1. Verifique se as variáveis de ambiente do Supabase estão corretas
2. Confirme se o usuário está logado
3. Verifique o console do navegador para outros erros
4. Reinicie o servidor de desenvolvimento se necessário
