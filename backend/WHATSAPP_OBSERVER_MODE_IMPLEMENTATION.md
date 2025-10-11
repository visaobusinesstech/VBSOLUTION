# Modo Observer-Only para WhatsApp - Implementação Completa

## 🎯 **Objetivo**
Implementar modo **Observer-Only** para verificar que mensagens reais do WhatsApp fluem corretamente do Baileys → Supabase → UI, sem simulações ou mocks.

## ✅ **Componentes Implementados**

### **1. Helper de Logging (`backend/src/utils/observer-logger.ts`)**
- `logEvent()` - Log centralizado para eventos
- `logInboundMessage()` - Log de mensagens recebidas
- `logOutboundMessage()` - Log de mensagens enviadas
- `logDbPersistOk()` - Log de persistência no banco
- `logSessionStatus()` - Log de status da sessão
- **Ativo apenas quando `FEATURE_WHATSAPP_STRICT_OBSERVE=true`**

### **2. Endpoint de Health (`backend/src/controllers/whatsapp-health.controller.ts`)**
- `GET /api/whatsapp-v2/health/whatsapp`
- Contadores em memória para mensagens
- Status da sessão ativa
- **Read-only, sem efeitos colaterais**

### **3. Script de Observação (`backend/scripts/watch-supabase.ts`)**
- Observa mudanças em tempo real no Supabase
- Tabelas: `whatsapp_mensagens`, `whatsapp_atendimentos`, `whatsapp_sessions`
- Logs compactos: `supabase_row_insert {table, keys...}`
- **Executa apenas quando `FEATURE_WHATSAPP_STRICT_OBSERVE=true`**

### **4. Integração nos Serviços**
- **WhatsApp V2 Service**: Logs de mensagens e sessões
- **Supabase Integration**: Logs de persistência
- **Frontend Hooks**: Debug logs para UI

## 🔧 **Configuração**

### **Variáveis de Ambiente**
```bash
FEATURE_WHATSAPP_V2=true
FEATURE_WHATSAPP_STRICT_OBSERVE=true
SUPABASE_URL=https://nrbsocawokmihvxfcpso.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Frontend (.env.local)**
```bash
VITE_FEATURE_WHATSAPP_STRICT_OBSERVE=true
```

## 🚀 **Como Executar**

### **1. Iniciar Backend**
```bash
cd backend
FEATURE_WHATSAPP_STRICT_OBSERVE=true npm run dev
```

### **2. Iniciar Frontend**
```bash
cd frontend
VITE_FEATURE_WHATSAPP_STRICT_OBSERVE=true npm run dev
```

### **3. Iniciar Observação do Supabase**
```bash
cd backend
node scripts/watch-supabase.ts
```

### **4. Testar Modo Observer**
```bash
cd backend
node test-observer-mode.js
```

## 📊 **Logs de Observação**

### **Backend Logs**
```json
{"timestamp":"2025-01-09T15:30:00.000Z","event":"wapp_inbound_message","message_id":"3A0240740802D0D7EA3C","chat_id":"554135217945@s.whatsapp.net","tipo":"TEXTO","remetente":"CLIENTE"}
{"timestamp":"2025-01-09T15:30:01.000Z","event":"wapp_db_persist_ok","table":"whatsapp_mensagens","row_id":"uuid-123","timestamp":"2025-01-09T15:30:01.000Z"}
{"timestamp":"2025-01-09T15:30:02.000Z","event":"wapp_session_status","session_name":"default","status":"CONNECTED","timestamp":"2025-01-09T15:30:02.000Z"}
```

### **Supabase Watcher**
```
supabase_row_insert {table:"whatsapp_mensagens", id=uuid-123, chat_id=554135217945@s.whatsapp.net, tipo=TEXTO...}
supabase_row_update {table:"whatsapp_atendimentos", id=uuid-456, ultima_mensagem=2025-01-09T15:30:00.000Z...}
```

### **Frontend Debug**
```
🔄 useWhatsAppConversations: loaded 6 conversations
```

## 🧪 **Teste Manual**

### **A) Enviar Mensagem do Telefone**
1. Envie uma mensagem de texto do seu telefone para o WhatsApp conectado
2. **Esperado nos logs do backend:**
   - `wapp_inbound_message` com chat_id `@s.whatsapp.net`
   - `wapp_db_persist_ok` para `whatsapp_mensagens`
   - `wapp_db_persist_ok` para `whatsapp_atendimentos`
3. **Esperado no watcher:**
   - `supabase_row_insert` para `whatsapp_mensagens`
4. **Esperado na UI:**
   - Conversa aparece na lista
   - Mensagem aparece no chat

### **B) Enviar Mensagem da UI**
1. Envie uma mensagem de texto da interface
2. **Esperado nos logs do backend:**
   - `wapp_outbound_message` com remetente `ATENDENTE`
   - `wapp_db_persist_ok` para `whatsapp_mensagens`
3. **Esperado no watcher:**
   - `supabase_row_insert` para `whatsapp_mensagens`
4. **Esperado no telefone:**
   - Mensagem recebida no WhatsApp

### **C) Testar Mídia (IMAGEM, AUDIO, VIDEO)**
1. Envie uma imagem/áudio/vídeo do telefone
2. **Esperado:**
   - Mesmo padrão de logs
   - Campos `media_url` e `media_mime` preenchidos
   - UI mostra preview da mídia

### **D) Reconexão da Sessão**
1. Desconecte e reconecte o WhatsApp
2. **Esperado nos logs:**
   - `wapp_session_status` para `DISCONNECTED`
   - `wapp_session_status` para `CONNECTED`
3. **Esperado no watcher:**
   - `supabase_row_update` para `whatsapp_sessions`

## 📋 **Checklist de Aceitação**

- [ ] **Backend logs**: `wapp_inbound_message` e `wapp_outbound_message`
- [ ] **Backend logs**: `wapp_db_persist_ok` para `whatsapp_mensagens` e `whatsapp_atendimentos`
- [ ] **Supabase watcher**: `supabase_row_insert` para `whatsapp_mensagens`
- [ ] **SQL spot-check**: Mensagens aparecem na tabela
- [ ] **UI**: Conversas aparecem na lista
- [ ] **UI**: Mensagens aparecem no chat
- [ ] **Mídia**: Pelo menos um tipo de mídia persistido com `media_url`/`media_mime`
- [ ] **Atendimento**: `ultima_mensagem` atualiza
- [ ] **Sessão**: Status logs e atualizações na tabela

## 🔍 **Troubleshooting**

### **Se logs mostram inbound mas sem DB writes:**
- Verificar cadeia de persistência
- Adicionar `await` faltante
- Tratar erros de persistência

### **Se DB writes ocorrem mas UI não atualiza:**
- Confirmar filtros do canal realtime
- Verificar atualização do store
- Adicionar debug console quando eventos chegam

### **Se nenhum inbound log:**
- Verificar se listeners Baileys estão anexados
- Confirmar log de sessão `CONNECTED`
- Verificar se conexão escolhida corresponde ao `SESSION_NAME`

## 🎉 **Resultado Esperado**

**O modo Observer-Only deve mostrar claramente que:**
1. ✅ Mensagens reais são recebidas do WhatsApp
2. ✅ Mensagens são persistidas no Supabase
3. ✅ UI atualiza em tempo real
4. ✅ Todos os tipos de mídia funcionam
5. ✅ Sessões são gerenciadas corretamente

**Sem simulações, sem mocks, apenas observação real do fluxo de dados!**
