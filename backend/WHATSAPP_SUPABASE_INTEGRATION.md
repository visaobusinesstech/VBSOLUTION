# Integração WhatsApp + Supabase - VBSolution CRM

## 📋 Visão Geral

Este sistema implementa uma integração robusta entre WhatsApp (usando Baileys) e Supabase, garantindo que:

- ✅ Mensagens sejam enviadas e recebidas corretamente
- ✅ Dados sejam persistidos nas tabelas corretas do Supabase
- ✅ A conexão nunca morra (sistema de watchdog)
- ✅ Fallback e retry automático em caso de falhas
- ✅ Monitoramento em tempo real

## 🏗️ Arquitetura

### Serviços Principais

1. **SupabaseWhatsAppService** - Gerencia conexão com Supabase
2. **WhatsAppIntegrationService** - Gerencia conexões WhatsApp via Baileys
3. **WhatsAppWatchdogService** - Monitora e mantém conexões ativas
4. **WhatsAppBootstrapService** - Inicializa e coordena todos os serviços

### Tabelas Supabase Utilizadas

- `whatsapp_sessions` - Sessões de conexão WhatsApp
- `whatsapp_atendimentos` - Atendimentos/clientes
- `whatsapp_mensagens` - Mensagens trocadas
- `whatsapp_configuracoes` - Configurações do robô

## 🚀 Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env.supabase` no diretório `backend/`:

```env
# Configuração do Supabase
SUPABASE_URL="https://mgvpuvjgzjeqhrkpdrel.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"

# Configuração do Servidor
PORT=3001
NODE_ENV=development

# Configuração de Segurança
CORS_ORIGIN="http://localhost:5173"
```

### 2. Instalação de Dependências

```bash
cd backend
npm install
```

### 3. Inicialização

```bash
npm run dev
```

## 📡 APIs Disponíveis

### Bootstrap (Controle Geral)

- `POST /api/whatsapp-bootstrap/initialize` - Inicializar serviços
- `GET /api/whatsapp-bootstrap/status` - Status dos serviços
- `GET /api/whatsapp-bootstrap/stats` - Estatísticas detalhadas
- `POST /api/whatsapp-bootstrap/test` - Teste completo do sistema
- `POST /api/whatsapp-bootstrap/restart` - Reiniciar serviços

### Integração WhatsApp

- `POST /api/whatsapp-integration/connections` - Criar conexão
- `GET /api/whatsapp-integration/connections` - Listar conexões
- `GET /api/whatsapp-integration/connections/:id` - Status da conexão
- `POST /api/whatsapp-integration/messages/send` - Enviar mensagem
- `GET /api/whatsapp-integration/messages/:atendimentoId` - Buscar mensagens
- `GET /api/whatsapp-integration/atendimentos/active` - Atendimentos ativos

## 🔧 Como Usar

### 1. Criar uma Conexão WhatsApp

```bash
curl -X POST http://localhost:3001/api/whatsapp-integration/connections \
  -H "Content-Type: application/json" \
  -d '{
    "connectionId": "minha-conexao-1",
    "name": "Conexão Principal",
    "ownerId": "user-uuid-here",
    "companyId": "company-uuid-here"
  }'
```

### 2. Obter QR Code

```bash
curl http://localhost:3001/api/whatsapp-integration/connections/minha-conexao-1/qr
```

### 3. Enviar Mensagem

```bash
curl -X POST http://localhost:3001/api/whatsapp-integration/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "connectionId": "minha-conexao-1",
    "to": "5511999999999@s.whatsapp.net",
    "content": "Olá! Como posso ajudar?",
    "type": "text"
  }'
```

### 4. Verificar Status

```bash
curl http://localhost:3001/api/whatsapp-bootstrap/status
```

## 🛡️ Recursos de Segurança

### Sistema de Fallback

- **Fila de Mensagens**: Mensagens são enfileiradas se Supabase estiver offline
- **Retry Automático**: Tentativas automáticas de reconexão
- **Health Check**: Verificação contínua da saúde dos serviços
- **Watchdog**: Monitoramento e correção automática de problemas

### Monitoramento

- **Logs Detalhados**: Todos os eventos são logados
- **Métricas em Tempo Real**: Status de conexões e filas
- **Alertas**: Notificações de problemas críticos

## 📊 Estrutura de Dados

### Mensagem (whatsapp_mensagens)

```typescript
{
  id: string;
  owner_id: string;
  atendimento_id: string;
  conteudo: string;
  tipo: 'TEXTO' | 'IMAGEM' | 'VIDEO' | 'AUDIO' | 'DOCUMENTO';
  remetente: 'CLIENTE' | 'ATENDENTE' | 'SISTEMA';
  timestamp: Date;
  lida: boolean;
  midia_url?: string;
  midia_tipo?: string;
  midia_nome?: string;
  midia_tamanho?: number;
}
```

### Atendimento (whatsapp_atendimentos)

```typescript
{
  id: string;
  owner_id: string;
  company_id?: string;
  numero_cliente: string;
  nome_cliente?: string;
  status: 'AGUARDANDO' | 'EM_ATENDIMENTO' | 'FINALIZADO' | 'CANCELADO';
  data_inicio: Date;
  data_fim?: Date;
  ultima_mensagem: Date;
  atendente_id?: string;
  prioridade: number;
  tags?: any;
  observacoes?: string;
  canal: string;
}
```

### Sessão (whatsapp_sessions)

```typescript
{
  id: string;
  owner_id: string;
  session_name: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  qr_code?: string;
  connected_at?: Date;
  disconnected_at?: Date;
}
```

## 🔍 Troubleshooting

### Problemas Comuns

1. **Supabase Offline**
   - Verificar variáveis de ambiente
   - Verificar conectividade de rede
   - Verificar logs: `tail -f logs/combined.log`

2. **Conexão WhatsApp Perdida**
   - O watchdog deve reconectar automaticamente
   - Verificar se o QR code foi escaneado
   - Verificar logs de conexão

3. **Mensagens Não Salvando**
   - Verificar se Supabase está online
   - Verificar fila de mensagens: `/api/whatsapp-bootstrap/stats`
   - Verificar logs de erro

### Logs Importantes

```bash
# Logs gerais
tail -f logs/combined.log

# Logs de erro
tail -f logs/error.log

# Logs do servidor
tail -f server.log
```

## 🚨 Alertas e Monitoramento

O sistema emite eventos que podem ser monitorados:

- `connected` - Conexão estabelecida
- `disconnected` - Conexão perdida
- `messageReceived` - Mensagem recebida
- `messageSent` - Mensagem enviada
- `supabaseOffline` - Supabase offline
- `healthCheck` - Health check executado

## 📈 Performance

### Otimizações Implementadas

- **Conexão Pool**: Reutilização de conexões
- **Batch Processing**: Processamento em lote de mensagens
- **Caching**: Cache de dados frequentes
- **Lazy Loading**: Carregamento sob demanda

### Métricas Monitoradas

- Tempo de resposta do Supabase
- Tamanho da fila de mensagens
- Número de conexões ativas
- Taxa de sucesso de envio de mensagens

## 🔄 Manutenção

### Limpeza Automática

- Conexões órfãs são removidas automaticamente
- Fila de mensagens é processada continuamente
- Logs antigos são rotacionados

### Backup

- Dados são persistidos no Supabase
- Sessões são salvas localmente
- Logs são mantidos para auditoria

## 📞 Suporte

Para problemas ou dúvidas:

1. Verificar logs primeiro
2. Executar teste do sistema: `POST /api/whatsapp-bootstrap/test`
3. Verificar status: `GET /api/whatsapp-bootstrap/status`
4. Reiniciar serviços se necessário: `POST /api/whatsapp-bootstrap/restart`

---

**Desenvolvido por VBSolution** 🚀
