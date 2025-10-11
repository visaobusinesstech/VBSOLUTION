// Script para criar a tabela ai_agent_messages no Supabase
import { supabase } from '@/integrations/supabase/client'

export async function createAIMemoryTable() {
  try {
    console.log('🤖 [MEMORY] Criando tabela ai_agent_messages...')
    
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    })

    if (error) {
      console.error('❌ [MEMORY] Erro ao criar tabela:', error)
      return false
    }

    console.log('✅ [MEMORY] Tabela ai_agent_messages criada com sucesso!')
    return true
  } catch (error) {
    console.error('❌ [MEMORY] Erro ao executar script:', error)
    return false
  }
}
