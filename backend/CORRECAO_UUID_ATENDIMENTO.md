# Correção do Erro de UUID no atendimento_id

## ❌ **Problema Identificado**

```
Erro ao salvar mensagem: {
  code: '22P02',
  details: null,
  hint: null,
  message: 'invalid input syntax for type uuid: "atendimento_559285880257"'
}
```

## 🔍 **Causa do Problema**

A coluna `atendimento_id` na tabela `whatsapp_mensagens` estava definida como `UUID`, mas o código estava tentando inserir strings como `"atendimento_559285880257"`, que não são UUIDs válidos.

## ✅ **Solução Implementada**

### **1. Geração de UUIDs Válidos**

**Antes:**
```javascript
const atendimentoId = `atendimento_${messageData.chat_id.replace('@s.whatsapp.net', '')}`;
// Resultado: "atendimento_559285880257" ❌
```

**Depois:**
```javascript
const atendimentoId = messageData.chat_id ? 
  `00000000-0000-0000-0000-${messageData.chat_id.replace('@s.whatsapp.net', '').padStart(12, '0')}` : 
  `00000000-0000-0000-0000-${Date.now().toString().slice(-12).padStart(12, '0')}`;
// Resultado: "00000000-0000-0000-0000-559285880257" ✅
```

### **2. Formato do UUID Gerado**

- **Padrão**: `00000000-0000-0000-0000-{NUMERO_TELEFONE}`
- **Exemplo**: `00000000-0000-0000-0000-559285880257`
- **Válido**: ✅ Passa na validação de UUID

### **3. Criação de Atendimentos**

Para cada mensagem, o sistema agora:
1. Gera um UUID válido baseado no número do telefone
2. Cria um registro na tabela `whatsapp_atendimentos` se não existir
3. Insere a mensagem na tabela `whatsapp_mensagens` com o UUID válido

## 🧪 **Teste Realizado**

```bash
# Teste de geração de UUID
Chat ID: 559285880257@s.whatsapp.net
Atendimento ID: 00000000-0000-0000-0000-559285880257
UUID válido: true ✅

# Teste de inserção no banco
Mensagem inserida com sucesso ✅
Status: AGUARDANDO ✅
```

## 📊 **Estrutura Final**

### **Tabela whatsapp_atendimentos**
```sql
CREATE TABLE whatsapp_atendimentos (
  id UUID PRIMARY KEY, -- UUID gerado automaticamente
  owner_id UUID NOT NULL,
  numero_cliente TEXT,
  nome_cliente TEXT,
  status TEXT,
  -- ... outras colunas
);
```

### **Tabela whatsapp_mensagens**
```sql
CREATE TABLE whatsapp_mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  atendimento_id UUID NOT NULL, -- Foreign key para whatsapp_atendimentos
  chat_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  tipo TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('AGUARDANDO', 'ATENDIDO', 'AI')),
  remetente TEXT NOT NULL,
  -- ... outras colunas
);
```

## 🎯 **Resultado**

- ✅ **Erro corrigido**: Mensagens sendo salvas com sucesso
- ✅ **UUIDs válidos**: Formato correto para o banco de dados
- ✅ **Sistema funcionando**: Backend processando mensagens normalmente
- ✅ **Status correto**: AGUARDANDO, ATENDIDO, AI funcionando

## 🚀 **Sistema Pronto**

O sistema agora está funcionando corretamente:
- Mensagens são salvas sem erros
- UUIDs são gerados no formato correto
- Status são aplicados automaticamente
- Pronto para receber mensagens do WhatsApp em tempo real
