# 🤖 Sistema Completo de AI Agent - Documentação

## 📋 Visão Geral

O sistema de AI Agent foi implementado com suporte completo a:
- **Configurações Pessoais**: Cada usuário pode ter seu próprio AI Agent
- **Configurações da Empresa**: AI Agent compartilhado por toda a empresa
- **Base de Conhecimento**: Sistema Q&A personalizável
- **Integração OpenAI**: Suporte completo à API do OpenAI
- **Persistência**: Todas as configurações são salvas no Supabase

## 🏗️ Arquitetura

### Frontend
- **Página**: `frontend/src/pages/AIAgent.tsx`
- **Hook**: `frontend/src/hooks/useAIAgentConfig.ts`
- **Interface**: Seleção entre configuração pessoal/empresa

### Backend
- **Arquivo**: `backend/simple-baileys-server.js`
- **Funções**: `generateAIResponse()`, `generateKnowledgeBasedResponse()`
- **Integração**: Busca configurações do banco de dados

### Banco de Dados
- **Tabela**: `ai_agent_configs`
- **Relacionamentos**: `owner_id` (usuário), `company_id` (empresa)
- **RLS**: Políticas de segurança por usuário e empresa

## 🚀 Como Funciona

### 1. Configuração do AI Agent

#### Configuração Pessoal
- Cada usuário pode criar seu próprio AI Agent
- Configurações salvas com `is_company_wide = false`
- Acessível apenas pelo usuário proprietário

#### Configuração da Empresa
- AI Agent compartilhado por toda a empresa
- Configurações salvas com `is_company_wide = true`
- Apenas usuários com permissões administrativas podem editar

### 2. Base de Conhecimento

O sistema suporta:
- **Q&A**: Perguntas e respostas personalizadas
- **Busca Inteligente**: Algoritmo de matching por palavras-chave
- **Fallback**: Respostas padrão quando não encontra correspondência

### 3. Integração com OpenAI

- **API Key**: Configurável por usuário/empresa
- **Modelos**: Suporte a GPT-4, GPT-4o, GPT-4o-mini
- **Fallback**: Sistema de respostas básicas quando API não disponível

## 📊 Estrutura do Banco de Dados

### Tabela: `ai_agent_configs`

```sql
CREATE TABLE public.ai_agent_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    function TEXT,
    personality TEXT,
    status TEXT DEFAULT 'inactive',
    response_style TEXT DEFAULT 'friendly',
    language TEXT DEFAULT 'pt-BR',
    max_response_length INTEGER DEFAULT 500,
    tone TEXT,
    rules TEXT,
    company_context TEXT,
    sector TEXT,
    company_description TEXT,
    knowledge_base JSONB DEFAULT '{}'::jsonb,
    api_key TEXT,
    selected_model TEXT DEFAULT 'gpt-4o-mini',
    is_connected BOOLEAN DEFAULT FALSE,
    is_company_wide BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Campos Importantes

- **`owner_id`**: ID do usuário proprietário
- **`company_id`**: ID da empresa (para configurações compartilhadas)
- **`is_company_wide`**: Se true, configuração é da empresa
- **`is_active`**: Se true, configuração está ativa
- **`knowledge_base`**: JSON com Q&A e outros dados
- **`api_key`**: Chave da API do OpenAI

## 🔧 Configuração e Instalação

### 1. Executar SQLs no Supabase

```bash
# 1. Atualizar estrutura da tabela
# Execute: update_ai_agent_configs_for_companies.sql

# 2. Configurar RLS e inserir dados padrão
# Execute: setup_ai_agent_rls.sql

# 3. Adicionar campo de tipo de atendimento
# Execute: add_attendance_type_column.sql
```

### 2. Configurar Frontend

O hook `useAIAgentConfig` gerencia automaticamente:
- Carregamento de configurações
- Salvamento de configurações
- Verificação de permissões
- Relacionamento usuário-empresa

### 3. Configurar Backend

O backend busca automaticamente:
1. Configuração da empresa (se usuário pertence a uma)
2. Configuração pessoal (fallback)
3. Respostas baseadas no conhecimento
4. Integração com OpenAI

## 🎯 Fluxo de Funcionamento

### 1. Usuário Configura AI Agent
```
Frontend → useAIAgentConfig → Supabase
```

### 2. Cliente Envia Mensagem
```
WhatsApp → Baileys → Backend → generateAIResponse()
```

### 3. Sistema Busca Configuração
```
generateAIResponse() → Supabase → ai_agent_configs
```

### 4. Gera Resposta
```
Configuração → Base de Conhecimento → OpenAI API → Resposta
```

### 5. Envia Resposta
```
Resposta → Baileys → WhatsApp → Cliente
```

## 🔒 Segurança e Permissões

### RLS (Row Level Security)

#### Configurações Pessoais
- Usuário pode ver/editar apenas suas próprias configurações
- `owner_id = auth.uid() AND is_company_wide = FALSE`

#### Configurações da Empresa
- Usuários da empresa podem ver configurações da empresa
- Apenas usuários com permissões administrativas podem editar
- `company_id IN (SELECT company_id FROM company_users WHERE id = auth.uid())`

## 🧪 Testes

### Scripts de Teste

```bash
# Testar sistema completo
node test_ai_agent_complete_system.js

# Testar fluxo de AI
node test_complete_ai_flow.js
```

### Testes Manuais

1. **Configurar AI Agent**
   - Acessar página AI Agent
   - Configurar nome, função, personalidade
   - Adicionar Q&A na base de conhecimento
   - Configurar API Key do OpenAI

2. **Testar Respostas**
   - Enviar mensagem para WhatsApp
   - Verificar se AI responde com conhecimento treinado
   - Testar diferentes tipos de pergunta

3. **Testar Configuração da Empresa**
   - Alternar para "Configuração da Empresa"
   - Verificar permissões de edição
   - Testar compartilhamento entre usuários

## 📝 Exemplos de Uso

### Configuração Básica

```javascript
// Frontend - Configurar AI Agent
const config = {
  name: "Assistente Virtual VB",
  function: "Atendimento ao cliente via WhatsApp",
  personality: "Profissional, prestativo e eficiente",
  knowledge_base: {
    qa: [
      {
        question: "Qual é o horário de funcionamento?",
        answer: "Funcionamos de segunda a sexta, das 8h às 18h."
      }
    ]
  },
  is_company_wide: false
};
```

### Base de Conhecimento

```json
{
  "qa": [
    {
      "id": "qa-1",
      "question": "Como posso entrar em contato?",
      "answer": "Você pode entrar em contato através do WhatsApp, email ou telefone."
    },
    {
      "id": "qa-2", 
      "question": "Quais serviços vocês oferecem?",
      "answer": "Oferecemos desenvolvimento de software, consultoria em tecnologia e soluções personalizadas."
    }
  ]
}
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **AI não responde**
   - Verificar se configuração está ativa (`is_active = true`)
   - Verificar se contato tem `ai_enabled = true`
   - Verificar logs do backend

2. **Configurações não salvam**
   - Verificar permissões RLS
   - Verificar se usuário está autenticado
   - Verificar se tem permissão para editar configuração da empresa

3. **Respostas genéricas**
   - Verificar se base de conhecimento está configurada
   - Verificar se API Key do OpenAI está configurada
   - Verificar se modelo selecionado é válido

### Logs Importantes

```bash
# Backend logs
🤖 ===== GERANDO RESPOSTA IA =====
🤖 Configuração de AI encontrada
🧠 Resposta encontrada na base de conhecimento
✅ Resposta IA enviada com sucesso!
```

## 🔄 Atualizações Futuras

### Funcionalidades Planejadas

1. **Múltiplas Configurações**
   - Permitir múltiplas configurações ativas por empresa
   - Sistema de templates de configuração

2. **Analytics**
   - Métricas de uso do AI Agent
   - Relatórios de eficácia das respostas

3. **Integração Avançada**
   - Suporte a outros LLMs (Claude, Gemini)
   - Sistema de plugins para funcionalidades customizadas

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs do backend
2. Executar scripts de teste
3. Verificar configurações no Supabase
4. Consultar esta documentação

---

**Sistema implementado com sucesso! 🎉**

O AI Agent está totalmente funcional com:
- ✅ Configurações pessoais e da empresa
- ✅ Base de conhecimento personalizável  
- ✅ Integração com OpenAI
- ✅ Persistência no Supabase
- ✅ Sistema de permissões
- ✅ Interface moderna e intuitiva
