# 🤖 Documentação dos Endpoints do AI Agent

## 📋 Visão Geral

Este documento descreve todos os endpoints disponíveis para o sistema de AI Agent, incluindo configurações e ações de processamento de texto.

## 🔗 Base URL

```
/api/ai-agent
```

## 🔐 Autenticação

Todos os endpoints requerem autenticação via middleware `authMiddleware`.

## 📊 Endpoints de Configuração

### 1. Obter Configuração do Agente IA

**GET** `/api/ai-agent/:ownerId`

Retorna a configuração completa do AI Agent para um usuário específico.

**Parâmetros:**
- `ownerId` (string, obrigatório) - ID do usuário proprietário

**Resposta de Sucesso:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "owner_id": "uuid",
    "name": "Assistente Virtual VB",
    "function": "Atendimento ao cliente via WhatsApp",
    "personality": "Profissional, prestativo e eficiente",
    "status": "active",
    "response_style": "friendly",
    "language": "pt-BR",
    "max_response_length": 500,
    "response_speed": "normal",
    "tone": "Tom específico",
    "rules": "Regras específicas",
    "company_context": "Contexto da empresa",
    "sector": "Setor de atuação",
    "company_description": "Descrição da empresa",
    "api_key": "***1234",
    "selected_model": "gpt-4o-mini",
    "creativity_temperature": 0.7,
    "max_tokens": 1000,
    "audio_transcription_enabled": false,
    "audio_transcription_language": "pt-BR",
    "knowledge_base": {
      "files": [],
      "websites": [],
      "qa": []
    },
    "is_company_wide": false,
    "company_id": null,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### 2. Salvar Configuração do Agente IA

**POST** `/api/ai-agent/:ownerId`

Salva ou atualiza a configuração completa do AI Agent.

**Parâmetros:**
- `ownerId` (string, obrigatório) - ID do usuário proprietário

**Body:**
```json
{
  "name": "Assistente Virtual VB",
  "function": "Atendimento ao cliente via WhatsApp",
  "personality": "Profissional, prestativo e eficiente",
  "status": "active",
  "response_style": "friendly",
  "language": "pt-BR",
  "max_response_length": 500,
  "response_speed": "normal",
  "tone": "Tom específico",
  "rules": "Regras específicas",
  "company_context": "Contexto da empresa",
  "sector": "Setor de atuação",
  "company_description": "Descrição da empresa",
  "api_key": "sk-...",
  "selected_model": "gpt-4o-mini",
  "creativity_temperature": 0.7,
  "max_tokens": 1000,
  "audio_transcription_enabled": false,
  "audio_transcription_language": "pt-BR",
  "knowledge_base": {
    "files": [],
    "websites": [],
    "qa": []
  },
  "is_company_wide": false,
  "company_id": null,
  "is_active": true
}
```

### 3. Atualizar Configuração do Agente IA

**PUT** `/api/ai-agent/:ownerId`

Atualiza a configuração existente do AI Agent.

**Parâmetros e Body:** Idênticos ao endpoint POST.

### 4. Salvar API Key do Agente IA

**POST** `/api/ai-agent/:ownerId/api-key`

Salva especificamente a API Key e configurações de integração.

**Parâmetros:**
- `ownerId` (string, obrigatório) - ID do usuário proprietário

**Body:**
```json
{
  "apiKey": "sk-...",
  "selectedModel": "gpt-4o-mini",
  "creativityTemperature": 0.7,
  "maxTokens": 1000
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "API Key salva com sucesso",
  "data": {
    "id": "uuid",
    "is_connected": true,
    "selected_model": "gpt-4o-mini",
    "creativity_temperature": 0.7,
    "max_tokens": 1000
  }
}
```

### 5. Ativar/Desativar Agente IA

**PATCH** `/api/ai-agent/:ownerId/toggle`

Ativa ou desativa o AI Agent.

**Parâmetros:**
- `ownerId` (string, obrigatório) - ID do usuário proprietário

**Body:**
```json
{
  "is_active": true
}
```

### 6. Deletar Configuração do Agente IA

**DELETE** `/api/ai-agent/:ownerId`

Remove a configuração do AI Agent.

**Parâmetros:**
- `ownerId` (string, obrigatório) - ID do usuário proprietário

## 🎯 Endpoints de Ações de IA

### 1. Listar Ações Disponíveis

**GET** `/api/ai-agent/actions`

Retorna lista de todas as ações disponíveis para processamento de texto.

**Resposta de Sucesso:**
```json
{
  "success": true,
  "data": {
    "actions": [
      {
        "id": "grammar",
        "name": "Corrigir Gramática",
        "description": "Corrige gramática e ortografia mantendo o tom original",
        "endpoint": "/api/ai-agent/:ownerId/actions/grammar",
        "method": "POST",
        "parameters": {
          "text": "string (obrigatório) - Texto a ser corrigido"
        }
      },
      // ... outras ações
    ],
    "total": 5,
    "description": "Ações disponíveis para processamento de texto com IA"
  }
}
```

### 2. Corrigir Gramática

**POST** `/api/ai-agent/:ownerId/actions/grammar`

Corrige gramática e ortografia do texto mantendo o tom original.

**Parâmetros:**
- `ownerId` (string, obrigatório) - ID do usuário proprietário

**Body:**
```json
{
  "text": "oi, como vc esta? quero saber mais sobre seus serviços"
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "data": {
    "originalText": "oi, como vc esta? quero saber mais sobre seus serviços",
    "correctedText": "Oi, como você está? Quero saber mais sobre seus serviços.",
    "action": "grammar_correction"
  }
}
```

### 3. Melhorar Texto

**POST** `/api/ai-agent/:ownerId/actions/improve`

Melhora o texto tornando-o mais amigável e profissional.

**Parâmetros:**
- `ownerId` (string, obrigatório) - ID do usuário proprietário

**Body:**
```json
{
  "text": "oi quanto custa um serviço?"
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "data": {
    "originalText": "oi quanto custa um serviço?",
    "improvedText": "Olá! Gostaria de saber quanto custa o seu serviço! 😊",
    "action": "text_improvement"
  }
}
```

### 4. Traduzir Texto

**POST** `/api/ai-agent/:ownerId/actions/translate`

Traduz texto para português brasileiro.

**Parâmetros:**
- `ownerId` (string, obrigatório) - ID do usuário proprietário

**Body:**
```json
{
  "text": "Hello, how are you? I want to know more about your services.",
  "targetLanguage": "pt-BR"
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "data": {
    "originalText": "Hello, how are you? I want to know more about your services.",
    "translatedText": "Olá, como você está? Quero saber mais sobre seus serviços.",
    "targetLanguage": "pt-BR",
    "action": "translation"
  }
}
```

### 5. Categorizar Texto

**POST** `/api/ai-agent/:ownerId/actions/categorize`

Analisa e organiza o texto em categorias.

**Parâmetros:**
- `ownerId` (string, obrigatório) - ID do usuário proprietário

**Body:**
```json
{
  "text": "Preciso de ajuda com desenvolvimento web, marketing digital e consultoria empresarial. Tenho urgência e orçamento limitado."
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "data": {
    "originalText": "Preciso de ajuda com desenvolvimento web, marketing digital e consultoria empresarial. Tenho urgência e orçamento limitado.",
    "categorizedText": "**Descrição do conteúdo:** Solicitação de múltiplos serviços empresariais com restrições de tempo e orçamento.\n\n**Categorias:**\n• **Serviços solicitados:**\n  - Desenvolvimento web\n  - Marketing digital\n  - Consultoria empresarial\n\n• **Restrições:**\n  - Urgência\n  - Orçamento limitado",
    "action": "categorization"
  }
}
```

### 6. Resumir Texto

**POST** `/api/ai-agent/:ownerId/actions/summarize`

Resume o texto mantendo informações importantes.

**Parâmetros:**
- `ownerId` (string, obrigatório) - ID do usuário proprietário

**Body:**
```json
{
  "text": "Nosso sistema de CRM oferece funcionalidades avançadas de gestão de clientes, automação de marketing, relatórios detalhados, integração com redes sociais, análise de dados em tempo real, e muito mais. É a solução completa para empresas que querem crescer e se destacar no mercado."
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "data": {
    "originalText": "Nosso sistema de CRM oferece funcionalidades avançadas...",
    "summarizedText": "Sistema de CRM completo com gestão de clientes, automação de marketing, relatórios, integração com redes sociais e análise de dados em tempo real para crescimento empresarial.",
    "action": "summarization"
  }
}
```

## ⚠️ Códigos de Erro

### 400 Bad Request
- Parâmetros obrigatórios ausentes
- Formato de dados inválido

### 401 Unauthorized
- Token de autenticação inválido ou ausente

### 404 Not Found
- Configuração do AI Agent não encontrada
- Usuário não encontrado

### 500 Internal Server Error
- Erro interno do servidor
- Problema com integração OpenAI

## 🔧 Exemplos de Uso

### JavaScript/TypeScript

```javascript
// Corrigir gramática
const response = await fetch('/api/ai-agent/user123/actions/grammar', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token'
  },
  body: JSON.stringify({
    text: 'oi, como vc esta?'
  })
});

const result = await response.json();
console.log(result.data.correctedText); // "Oi, como você está?"
```

### cURL

```bash
# Listar ações disponíveis
curl -X GET "http://localhost:3000/api/ai-agent/actions" \
  -H "Authorization: Bearer your-token"

# Melhorar texto
curl -X POST "http://localhost:3000/api/ai-agent/user123/actions/improve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"text": "oi quanto custa um serviço?"}'
```

## 📝 Notas Importantes

1. **API Key**: Deve ser configurada antes de usar as ações de IA
2. **Rate Limiting**: Respeite os limites da API do OpenAI
3. **Idioma**: Por padrão, as ações trabalham com português brasileiro
4. **Tamanho**: Textos muito longos podem ser truncados conforme `max_tokens`
5. **Custos**: Cada ação consome tokens da API do OpenAI

## 🚀 Próximos Passos

- [ ] Adicionar cache para respostas frequentes
- [ ] Implementar rate limiting por usuário
- [ ] Adicionar métricas de uso
- [ ] Criar interface de teste para os endpoints
- [ ] Implementar webhooks para notificações
