-- Criar tabela para configurações do AI Agent
CREATE TABLE IF NOT EXISTS public.ai_agent_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Cargo (Role) - Comportamento do agente
    name TEXT NOT NULL DEFAULT 'Assistente Virtual VB',
    function TEXT NOT NULL DEFAULT 'Atendimento ao cliente via WhatsApp',
    personality TEXT NOT NULL DEFAULT 'Profissional, prestativo e eficiente',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'training')),
    response_style TEXT NOT NULL DEFAULT 'friendly' CHECK (response_style IN ('formal', 'casual', 'friendly', 'professional')),
    language TEXT NOT NULL DEFAULT 'pt-BR',
    max_response_length INTEGER NOT NULL DEFAULT 500,
    response_speed TEXT DEFAULT 'normal',
    
    -- Configurações avançadas
    tone TEXT,
    rules TEXT,
    company_context TEXT,
    sector TEXT,
    company_description TEXT,
    
    -- Integração - Configurações de API
    api_key TEXT,
    selected_model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    is_connected BOOLEAN DEFAULT false,
    
    -- Base de conhecimento (JSON)
    knowledge_base JSONB DEFAULT '{
        "files": [],
        "websites": [],
        "qa": []
    }'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_agent_configs_owner_id ON public.ai_agent_configs(owner_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_configs_status ON public.ai_agent_configs(status);

-- RLS (Row Level Security)
ALTER TABLE public.ai_agent_configs ENABLE ROW LEVEL SECURITY;

-- Política RLS: usuários só podem ver/editar suas próprias configurações
CREATE POLICY "Users can manage their own AI agent configs" ON public.ai_agent_configs
    FOR ALL USING (auth.uid() = owner_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_ai_agent_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_agent_configs_updated_at
    BEFORE UPDATE ON public.ai_agent_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_agent_configs_updated_at();

-- Inserir configuração padrão para o usuário de teste
INSERT INTO public.ai_agent_configs (
    owner_id,
    name,
    function,
    personality,
    status,
    response_style,
    language,
    max_response_length,
    response_speed,
    tone,
    rules,
    company_context,
    sector,
    company_description,
    api_key,
    selected_model,
    is_connected,
    knowledge_base
) VALUES (
    '905b926a-785a-4f6d-9c3a-9455729500b3', -- ID do usuário de teste
    'Assistente Virtual VB',
    'Atendimento ao cliente via WhatsApp',
    'Profissional, prestativo e eficiente',
    'active',
    'friendly',
    'pt-BR',
    500,
    'normal',
    'Amigável e prestativo',
    'Sempre ser educado e oferecer ajuda',
    'Empresa de tecnologia focada em soluções inovadoras',
    'Tecnologia',
    'Somos uma empresa especializada em desenvolvimento de software e soluções tecnológicas para empresas',
    '', -- API key será configurada pelo usuário
    'gpt-4o-mini',
    false,
    '{
        "files": [],
        "websites": [],
        "qa": [
            {
                "id": "1",
                "question": "Quais são os serviços oferecidos?",
                "answer": "Oferecemos desenvolvimento de software, consultoria em tecnologia, soluções personalizadas e suporte técnico.",
                "category": "servicos"
            },
            {
                "id": "2", 
                "question": "Como entrar em contato?",
                "answer": "Você pode entrar em contato através do WhatsApp, email ou telefone. Nossa equipe está sempre disponível para ajudar.",
                "category": "contato"
            }
        ]
    }'::jsonb
) ON CONFLICT (owner_id) DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE public.ai_agent_configs IS 'Configurações dos Agentes de IA para cada usuário';
COMMENT ON COLUMN public.ai_agent_configs.name IS 'Nome do assistente virtual';
COMMENT ON COLUMN public.ai_agent_configs.function IS 'Função principal do assistente';
COMMENT ON COLUMN public.ai_agent_configs.personality IS 'Personalidade e comportamento do assistente';
COMMENT ON COLUMN public.ai_agent_configs.status IS 'Status do agente: active, inactive, training';
COMMENT ON COLUMN public.ai_agent_configs.response_style IS 'Estilo de resposta: formal, casual, friendly, professional';
COMMENT ON COLUMN public.ai_agent_configs.api_key IS 'Chave da API do OpenAI (armazenada de forma segura)';
COMMENT ON COLUMN public.ai_agent_configs.selected_model IS 'Modelo do OpenAI selecionado';
COMMENT ON COLUMN public.ai_agent_configs.knowledge_base IS 'Base de conhecimento em formato JSON';

