-- SQL SIMPLIFICADO PARA SUPABASE
-- Execute este SQL no Supabase Dashboard

-- 1. Criar tabela de pipelines
CREATE TABLE IF NOT EXISTS public.pipelines (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Adicionar coluna pipeline_id na tabela funnel_stages
ALTER TABLE public.funnel_stages 
ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES public.pipelines(id);

-- 3. Inserir pipeline padrão
INSERT INTO public.pipelines (name, description, is_default, is_active) 
VALUES ('Pipeline Padrão', 'Pipeline padrão do sistema', true, true);

-- 4. Atualizar etapas existentes com pipeline_id da pipeline padrão
UPDATE public.funnel_stages 
SET pipeline_id = (
    SELECT id FROM public.pipelines WHERE is_default = true LIMIT 1
)
WHERE pipeline_id IS NULL;

-- 5. Habilitar RLS
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;

-- 6. Criar política RLS (SIMPLIFICADO)
CREATE POLICY "pipelines_policy" ON public.pipelines 
FOR ALL USING (true);
