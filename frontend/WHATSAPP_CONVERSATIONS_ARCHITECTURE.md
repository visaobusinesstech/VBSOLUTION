# Arquitetura do Sistema de Conversas WhatsApp

## 🏗️ **Arquitetura Simplificada e Unificada**

### **Problema Resolvido**
A análise identificou que o sistema anterior tinha múltiplas fontes de verdade e complexidade desnecessária:
- Múltiplos hooks e contextos concorrentes
- Owner ID hardcoded
- Lógica de atualização em tempo real fragmentada
- Estrutura de dados inconsistente

### **Solução Implementada**

#### **1. Contexto Unificado (`WhatsAppConversationsContext.tsx`)**
- **Única fonte de verdade** para todas as conversas e mensagens
- **Gerenciamento de estado centralizado** com React Context
- **Socket.IO integrado** para atualizações em tempo real
- **Filtragem automática** por `connection_id` ativo
- **Agrupamento inteligente** de mensagens por `chat_id`

#### **2. Página Simplificada (`WhatsAppConversations.tsx`)**
- **Interface Manychat-like** mantida
- **Lógica de negócio removida** - delegada ao contexto
- **Estado local mínimo** apenas para UI (search, messageInput)
- **Integração direta** com o contexto unificado

#### **3. Página Principal (`WhatsAppPage.tsx`)**
- **Wrapper simples** que fornece o contexto
- **Verificação de conexão ativa** antes de renderizar
- **Provider pattern** para injeção de dependências

### **Fluxo de Dados**

```
Supabase whatsapp_mensagens
    ↓
WhatsAppConversationsContext (Socket.IO + Supabase)
    ↓
WhatsAppConversations (UI)
    ↓
Usuário
```

### **Funcionalidades Implementadas**

#### **✅ Carregamento de Dados**
- Busca mensagens do Supabase filtradas por `connection_id`
- Agrupa mensagens por `chat_id` para criar conversas
- Ordena conversas por última mensagem

#### **✅ Atualizações em Tempo Real**
- Socket.IO conecta automaticamente quando `connection_id` muda
- Escuta eventos `newMessage` e `conversation:updated`
- Atualiza interface instantaneamente quando novas mensagens chegam

#### **✅ Gerenciamento de Estado**
- `conversations`: Lista de conversas agrupadas
- `selectedConversation`: ID da conversa selecionada
- `selectedMessages`: Mensagens da conversa selecionada
- `loading` e `error`: Estados de carregamento e erro

#### **✅ Operações de Mensagens**
- `sendMessage()`: Envia mensagem via API do backend
- `markAsRead()`: Marca mensagens como lidas
- `refreshConversations()`: Recarrega conversas do Supabase

### **Estrutura de Dados**

#### **WhatsAppMessage**
```typescript
{
  id: string;
  conteudo: string;
  message_type: string;
  status: 'AGUARDANDO' | 'ATENDIDO' | 'AI';
  remetente: 'CLIENTE' | 'OPERADOR' | 'AI';
  chat_id: string;
  connection_id: string;
  timestamp: string;
  lida: boolean;
  // ... outros campos
}
```

#### **WhatsAppConversation**
```typescript
{
  id: string; // chat_id
  chat_id: string;
  nome_cliente: string;
  numero_cliente: string;
  lastMessage: WhatsAppMessage | null;
  lastMessageAt: string;
  unread: number;
  status: 'AGUARDANDO' | 'ATENDIDO' | 'AI';
  messages: WhatsAppMessage[];
}
```

### **Integração com Backend**

#### **Socket.IO Events**
- `joinConnection`: Entra na sala da conexão
- `newMessage`: Nova mensagem recebida
- `conversation:updated`: Conversa atualizada

#### **API Endpoints**
- `GET /api/baileys-simple/connections`: Lista conexões
- `POST /api/baileys-simple/connections/:id/send-message`: Envia mensagem

### **Vantagens da Nova Arquitetura**

1. **Simplicidade**: Uma única fonte de verdade
2. **Manutenibilidade**: Código organizado e modular
3. **Performance**: Atualizações em tempo real eficientes
4. **Escalabilidade**: Fácil adicionar novas funcionalidades
5. **Testabilidade**: Lógica de negócio isolada no contexto

### **Como Usar**

```tsx
// 1. Envolver a aplicação com o provider
<WhatsAppConversationsProvider connectionId={activeConnection.id}>
  <WhatsAppConversations />
</WhatsAppConversationsProvider>

// 2. Usar o hook no componente
const {
  conversations,
  selectedMessages,
  sendMessage,
  setSelectedConversation
} = useWhatsAppConversations();
```

### **Próximos Passos**

1. **Testes**: Implementar testes unitários para o contexto
2. **Otimizações**: Implementar paginação para conversas
3. **Features**: Adicionar filtros avançados e busca
4. **Monitoramento**: Adicionar logs de performance

---

**Status**: ✅ Implementado e Funcionando
**Última Atualização**: 11/09/2025
**Versão**: 2.0.0
