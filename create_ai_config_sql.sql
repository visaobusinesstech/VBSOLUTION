-- Criar configuração de IA ativa para o usuário
INSERT INTO ai_agent_configs (
  name,
  function,
  personality,
  response_style,
  language,
  max_response_length,
  api_key,
  selected_model,
  is_connected,
  is_active,
  owner_id,
  is_company_wide,
  knowledge_base,
  integration
) VALUES (
  'Assistente Virtual VB',
  'atendimento ao cliente',
  'Profissional, prestativo e eficiente',
  'friendly',
  'pt-BR',
  500,
  'sk-test-key-123',
  'gpt-3.5-turbo',
  true,
  true,
  '905b926a-785a-4f6d-9c3a-9455729500b3',
  false,
  '{
    "files": [],
    "websites": [],
    "qa": [
      {
        "id": "1",
        "question": "Como funciona o serviço?",
        "answer": "Nosso serviço oferece soluções completas para seu negócio, incluindo sistema de atendimento via WhatsApp com inteligência artificial."
      },
      {
        "id": "2", 
        "question": "Quanto custa?",
        "answer": "Temos planos flexíveis que se adaptam ao seu orçamento. Entre em contato para um orçamento personalizado."
      },
      {
        "id": "3",
        "question": "Qual empresa?",
        "answer": "Somos a VB Solutions, especializada em sistemas de atendimento e automação para empresas."
      }
    ]
  }',
  '{
    "api_key": "sk-test-key-123",
    "selected_model": "gpt-3.5-turbo",
    "is_connected": true
  }'
)
ON CONFLICT (owner_id, is_company_wide) 
DO UPDATE SET
  name = EXCLUDED.name,
  function = EXCLUDED.function,
  personality = EXCLUDED.personality,
  response_style = EXCLUDED.response_style,
  language = EXCLUDED.language,
  max_response_length = EXCLUDED.max_response_length,
  api_key = EXCLUDED.api_key,
  selected_model = EXCLUDED.selected_model,
  is_connected = EXCLUDED.is_connected,
  is_active = EXCLUDED.is_active,
  knowledge_base = EXCLUDED.knowledge_base,
  integration = EXCLUDED.integration,
  updated_at = NOW();
