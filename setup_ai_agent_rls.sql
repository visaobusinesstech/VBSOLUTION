-- Configurar RLS temporariamente para permitir inserção de configurações do AI Agent
-- Execute este SQL no Supabase SQL Editor

-- Desabilitar RLS temporariamente para configurações
ALTER TABLE public.ai_agent_configs DISABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view and manage their personal AI configs" ON public.ai_agent_configs;
DROP POLICY IF EXISTS "Company users can view and manage company AI configs" ON public.ai_agent_configs;

-- Inserir configuração padrão para teste
INSERT INTO public.ai_agent_configs (
  owner_id,
  company_id,
  name,
  function,
  personality,
  status,
  response_style,
  language,
  max_response_length,
  knowledge_base,
  api_key,
  selected_model,
  is_company_wide,
  is_active
) VALUES (
  '905b926a-785a-4f6d-9c3a-9455729500b3', -- Substitua pelo ID do usuário real
  NULL, -- Configuração pessoal
  'Assistente Virtual VB',
  'Atendimento ao cliente via WhatsApp',
  'Profissional, prestativo e eficiente. Sempre busca ajudar o cliente da melhor forma possível.',
  'active',
  'friendly',
  'pt-BR',
  500,
  '{
    "qa": [
      {
        "id": "qa-1",
        "question": "Qual é o horário de funcionamento?",
        "answer": "Funcionamos de segunda a sexta, das 8h às 18h, e aos sábados das 9h às 13h."
      },
      {
        "id": "qa-2", 
        "question": "Como posso entrar em contato?",
        "answer": "Você pode entrar em contato através do WhatsApp, email ou telefone. Nossa equipe está sempre disponível para ajudar!"
      },
      {
        "id": "qa-3",
        "question": "Quais serviços vocês oferecem?",
        "Oferecemos desenvolvimento de software, consultoria em tecnologia, soluções personalizadas e suporte técnico completo."
      },
      {
        "id": "qa-4",
        "question": "Quanto custa o serviço?",
        "answer": "Nossos preços variam conforme o projeto e suas necessidades específicas. Posso enviar uma proposta personalizada para você. Qual tipo de serviço você precisa?"
      }
    ]
  }'::jsonb,
  'YOUR_OPENAI_API_KEY', -- Substitua pela sua API key real
  'gpt-4o-mini',
  false, -- Configuração pessoal
  true
) ON CONFLICT (owner_id, company_id, is_company_wide) 
DO UPDATE SET
  name = EXCLUDED.name,
  function = EXCLUDED.function,
  personality = EXCLUDED.personality,
  status = EXCLUDED.status,
  response_style = EXCLUDED.response_style,
  language = EXCLUDED.language,
  max_response_length = EXCLUDED.max_response_length,
  knowledge_base = EXCLUDED.knowledge_base,
  api_key = EXCLUDED.api_key,
  selected_model = EXCLUDED.selected_model,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Reabilitar RLS
ALTER TABLE public.ai_agent_configs ENABLE ROW LEVEL SECURITY;

-- Recriar políticas de RLS
CREATE POLICY "Users can view and manage their personal AI configs"
ON public.ai_agent_configs FOR ALL
USING (
  owner_id = auth.uid() AND 
  (company_id IS NULL OR is_company_wide = FALSE)
)
WITH CHECK (
  owner_id = auth.uid() AND 
  (company_id IS NULL OR is_company_wide = FALSE)
);

CREATE POLICY "Company users can view and manage company AI configs"
ON public.ai_agent_configs FOR ALL
USING (
  company_id IN (
    SELECT cu.company_id 
    FROM public.company_users cu 
    WHERE cu.id = auth.uid()
  ) AND is_company_wide = TRUE
)
WITH CHECK (
  company_id IN (
    SELECT cu.company_id 
    FROM public.company_users cu 
    WHERE cu.id = auth.uid()
  ) AND is_company_wide = TRUE
);

-- Verificar se a configuração foi criada
SELECT 
  id,
  name,
  function,
  personality,
  is_company_wide,
  is_active,
  created_at
FROM public.ai_agent_configs 
WHERE owner_id = '905b926a-785a-4f6d-9c3a-9455729500b3'
ORDER BY created_at DESC;
