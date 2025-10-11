-- Desabilitar RLS temporariamente para inserir configuração
ALTER TABLE public.ai_agent_configs DISABLE ROW LEVEL SECURITY;

-- Inserir configuração padrão
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
    selected_model,
    is_connected,
    knowledge_base
) VALUES (
    '905b926a-785a-4f6d-9c3a-9455729500b3',
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
);

-- Reabilitar RLS
ALTER TABLE public.ai_agent_configs ENABLE ROW LEVEL SECURITY;

