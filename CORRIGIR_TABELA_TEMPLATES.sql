-- Script para corrigir a tabela templates
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a tabela templates existe, se não existir, criar
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    conteudo TEXT,
    canal TEXT DEFAULT 'email',
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    assinatura TEXT,
    signature_image TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    descricao TEXT,
    template_file_url TEXT,
    template_file_name TEXT,
    image_url TEXT,
    font_size_px TEXT DEFAULT '16px',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Adicionar colunas que podem estar faltando
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS conteudo TEXT;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS canal TEXT DEFAULT 'email';
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo';
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS assinatura TEXT;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS signature_image TEXT;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS template_file_url TEXT;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS template_file_name TEXT;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS font_size_px TEXT DEFAULT '16px';
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Criar índices
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON public.templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_canal ON public.templates(canal);
CREATE INDEX IF NOT EXISTS idx_templates_status ON public.templates(status);

-- 4. Habilitar RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- 5. Remover políticas existentes
DROP POLICY IF EXISTS "Users can view their own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can insert their own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON public.templates;

-- 6. Criar políticas RLS
CREATE POLICY "Users can view their own templates" ON public.templates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates" ON public.templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" ON public.templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" ON public.templates
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Trigger para updated_at
DROP TRIGGER IF EXISTS update_templates_updated_at ON public.templates;
CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON public.templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Inserir template de teste se não houver nenhum
INSERT INTO public.templates (user_id, owner_id, nome, conteudo, canal, status)
SELECT 
    auth.uid(),
    auth.uid(),
    'Template de Teste',
    'Este é um template de teste para verificar se a funcionalidade está funcionando.',
    'email',
    'ativo'
WHERE NOT EXISTS (
    SELECT 1 FROM public.templates 
    WHERE user_id = auth.uid() 
    AND canal = 'email' 
    AND status = 'ativo'
);

-- 10. Verificar se a tabela foi criada corretamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'templates' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 11. Verificar se há templates
SELECT 
    id,
    nome,
    canal,
    status,
    user_id,
    created_at
FROM public.templates
WHERE user_id = auth.uid()
ORDER BY created_at DESC;


