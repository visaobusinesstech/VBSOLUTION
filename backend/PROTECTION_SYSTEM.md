# 🛡️ SISTEMA DE PROTEÇÃO - WhatsApp Integration (v2.0)

## ⚠️ **ATENÇÃO: ARQUIVOS CRÍTICOS - NÃO MODIFICAR SEM AUTORIZAÇÃO**

Este documento lista os arquivos críticos que **NÃO PODEM** ser modificados sem seguir o processo de proteção.

---

## 📋 **ARQUIVOS CRÍTICOS PROTEGIDOS**

### 1. **Backend - Processamento de Mensagens**
- **`backend/simple-baileys-server.js`** - ⚠️ **CRÍTICO**
  - **Função:** Servidor principal do Baileys
  - **NÃO ALTERAR:** Lógica de salvamento de mensagens (linhas 380-450)
  - **NÃO ALTERAR:** Referências a `message_type` (não `tipo`)
  - **NÃO ALTERAR:** Sistema de Socket.IO para tempo real

- **`backend/message-normalizer.js`** - ⚠️ **CRÍTICO**
  - **Função:** Normaliza mensagens do WhatsApp para o formato do banco
  - **Colunas obrigatórias:** `message_type`, `media_type`, `conteudo`
  - **NÃO ALTERAR:** Estrutura do `mapToDbRow()` sem atualizar o banco

### 2. **Frontend - Interface e Hooks**
- **`frontend/src/contexts/ConnectionsContext.tsx`** - ⚠️ **CRÍTICO**
  - **Função:** Gerencia conexões e modais
  - **NÃO ALTERAR:** Sistema de QR code (1m30s timeout)
  - **NÃO ALTERAR:** Modal de desconexão

- **`frontend/src/hooks/useWhatsAppConversations.ts`** - ⚠️ **CRÍTICO**
  - **Função:** Hook unificado para buscar conversas do Supabase
  - **NÃO ALTERAR:** Integração com tabela `whatsapp_mensagens`
  - **NÃO ALTERAR:** Sistema de status (AGUARDANDO, ATENDIDO, AI)

- **`frontend/src/pages/WhatsAppSimple.tsx`** - ⚠️ **CRÍTICO**
  - **Função:** Página moderna de conversas do WhatsApp (design Manychat-like)
  - **NÃO ALTERAR:** Integração com `useWhatsAppConversations`
  - **NÃO ALTERAR:** Sistema de 3 colunas (conversas, mensagens, detalhes)

- **`frontend/src/components/ConnectionsModalProvider.tsx`** - ⚠️ **CRÍTICO**
  - **Função:** Provider de modais de conexão
  - **NÃO ALTERAR:** Modal de desconexão

### 3. **Banco de Dados - Estrutura**
- **Tabela `whatsapp_mensagens`** - ⚠️ **CRÍTICO**
  - **Colunas obrigatórias:**
    - `message_type` (não `tipo`)
    - `media_type`
    - `conteudo`
    - `atendimento_id` (nullable)
    - `connection_id`
    - `phone_number`
  - **NÃO CRIAR:** Foreign key para `whatsapp_atendimentos`
  - **NÃO CRIAR:** Tabela `whatsapp_atendimentos`

---

## 🔒 **REGRAS DE PROTEÇÃO**

### ✅ **PERMITIDO:**
- Adicionar novas colunas na tabela `whatsapp_mensagens`
- Adicionar novos tipos de mensagem no `message-normalizer.js`
- Melhorar interface do frontend (sem quebrar funcionalidade)
- Adicionar logs e debugging
- Adicionar funcionalidades de anexos e áudio

### ❌ **PROIBIDO:**
- Renomear `message_type` de volta para `tipo`
- Criar foreign key para `whatsapp_atendimentos`
- Remover coluna `media_type`
- Alterar estrutura do `mapToDbRow()`
- Modificar timeout do QR code (1m30s)
- Quebrar modal de desconexão
- Alterar sistema de 3 colunas da página moderna

---

## 🚨 **PROCESSO DE MODIFICAÇÃO**

Antes de modificar qualquer arquivo crítico:

1. **Backup obrigatório:**
   ```bash
   git add -A && git commit -m "BACKUP: Antes de modificar [ARQUIVO]"
   ```

2. **Teste obrigatório:**
   - Criar conexão WhatsApp
   - Enviar mensagem de texto
   - Enviar imagem/vídeo
   - Verificar salvamento no Supabase
   - Testar página moderna `WhatsAppSimple.tsx`

3. **Validação:**
   - Mensagens aparecem na tabela `whatsapp_mensagens`
   - Coluna `conteudo` preenchida
   - Coluna `message_type` correta
   - Sem erros de foreign key
   - Página moderna funciona corretamente

---

## 🔧 **COMANDOS DE VERIFICAÇÃO**

### Verificar se sistema está funcionando:
```bash
# 1. Iniciar servidor
cd backend && node simple-baileys-server.js

# 2. Testar API
curl -X GET http://localhost:3000/api/baileys-simple/health

# 3. Testar página moderna
# Acesse: http://localhost:5173/whatsapp
```

### Verificar banco de dados:
```sql
-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'whatsapp_mensagens' 
ORDER BY ordinal_position;

-- Verificar se foreign key foi removida
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'whatsapp_mensagens' 
AND constraint_type = 'FOREIGN KEY';
```

---

## 📞 **SUPORTE**

Se algo quebrar:
1. Verificar este documento
2. Executar comandos de verificação
3. Restaurar backup do Git
4. Contatar equipe de desenvolvimento

---

**Última atualização:** $(date)
**Versão:** 2.0
**Status:** ✅ ATIVO
**Arquitetura:** Página moderna unificada com hook único
