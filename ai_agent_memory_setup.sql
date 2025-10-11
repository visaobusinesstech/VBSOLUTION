-- Script para criar tabela ai_agent_messages no Supabase
-- Execute este script no SQL Editor do Supabase

-- Criar tabela para mensagens do AI Agent
CREATE TABLE IF NOT EXISTS public.ai_agent_messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_agent_messages_conversation_id ON public.ai_agent_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_messages_created_at ON public.ai_agent_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_agent_messages_role ON public.ai_agent_messages(role);

-- Habilitar RLS
ALTER TABLE public.ai_agent_messages ENABLE ROW LEVEL SECURITY;

-- Criar política RLS para permitir todas as operações para usuários autenticados
CREATE POLICY "Allow all operations for authenticated users" ON public.ai_agent_messages
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_ai_agent_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
CREATE TRIGGER trigger_update_ai_agent_messages_updated_at
    BEFORE UPDATE ON public.ai_agent_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_agent_messages_updated_at();
