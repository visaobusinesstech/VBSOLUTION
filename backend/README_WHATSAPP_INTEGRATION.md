# 🚀 Integração WhatsApp + Supabase - VBSolution CRM

## 📋 Visão Geral

Sistema completo de integração entre WhatsApp (Baileys) e Supabase, garantindo:

- ✅ **Envio e recebimento de mensagens** via WhatsApp
- ✅ **Persistência automática** em tabelas Supabase
- ✅ **Conexão sempre ativa** com sistema de watchdog
- ✅ **Fallback e retry** em caso de falhas
- ✅ **Monitoramento em tempo real** de todas as operações

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   WhatsApp      │    │   Backend        │    │   Supabase      │
│   (Baileys)     │◄──►│   Integration    │◄──►│   Database      │
│                 │    │   Service        │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   Watchdog       │
                       │   Service        │
                       └──────────────────┘
```

## 🚀 Início Rápido

### 1. Configuração

```bash
# Copiar arquivo de configuração
cp .env.supabase.example .env.supabase

# Editar com suas credenciais do Supabase
nano .env.supabase
```

### 2. Instalação

```bash
# Instalar dependências
npm install

# Compilar TypeScript
npm run build
```

### 3. Execução

```bash
# Modo desenvolvimento
npm run start:whatsapp:dev

# Modo produção
npm run start:whatsapp
```

### 4. Teste

```bash
# Executar testes de integração
npm run test:integration
```

## 📡 APIs Disponíveis

### 🔧 Bootstrap (Controle Geral)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/whatsapp-bootstrap/initialize` | Inicializar todos os serviços |
| `GET` | `/api/whatsapp-bootstrap/status` | Status dos serviços |
| `GET` | `/api/whatsapp-bootstrap/stats` | Estatísticas detalhadas |
| `POST` | `/api/whatsapp-bootstrap/test` | Teste completo do sistema |
| `POST` | `/api/whatsapp-bootstrap/restart` | Reiniciar serviços |

### 📱 Integração WhatsApp

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/whatsapp-integration/connections` | Criar conexão WhatsApp |
| `GET` | `/api/whatsapp-integration/connections` | Listar conexões |
| `GET` | `/api/whatsapp-integration/connections/:id` | Status da conexão |
| `DELETE` | `/api/whatsapp-integration/connections/:id` | Remover conexão |
| `GET` | `/api/whatsapp-integration/connections/:id/qr` | Obter QR Code |
| `POST` | `/api/whatsapp-integration/messages/send` | Enviar mensagem |
| `GET` | `/api/whatsapp-integration/messages/:atendimentoId` | Buscar mensagens |
| `GET` | `/api/whatsapp-integration/atendimentos/active` | Atendimentos ativos |
| `GET` | `/api/whatsapp-integration/sessions/active` | Sessões ativas |

## 💾 Estrutura de Dados

### Tabelas Supabase

#### `whatsapp_sessions`
Armazena informações das sessões de conexão WhatsApp.

```sql
CREATE TABLE whatsapp_sessions (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL,
  session_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected',
  qr_code TEXT,
  connected_at TIMESTAMP WITH TIME ZONE,
  disconnected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `whatsapp_atendimentos`
Armazena informações dos atendimentos/clientes.

```sql
CREATE TABLE whatsapp_atendimentos (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL,
  company_id UUID,
  numero_cliente TEXT NOT NULL,
  nome_cliente TEXT,
  status TEXT NOT NULL DEFAULT 'AGUARDANDO',
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  data_fim TIMESTAMP WITH TIME ZONE,
  ultima_mensagem TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  atendente_id UUID,
  prioridade INTEGER DEFAULT 1,
  tags JSONB,
  observacoes TEXT,
  canal TEXT DEFAULT 'whatsapp',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `whatsapp_mensagens`
Armazena todas as mensagens trocadas.

```sql
CREATE TABLE whatsapp_mensagens (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL,
  atendimento_id UUID NOT NULL REFERENCES whatsapp_atendimentos(id),
  conteudo TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'TEXTO',
  remetente TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  lida BOOLEAN DEFAULT FALSE,
  midia_url TEXT,
  midia_tipo TEXT,
  midia_nome TEXT,
  midia_tamanho INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `whatsapp_configuracoes`
Armazena configurações do robô WhatsApp.

```sql
CREATE TABLE whatsapp_configuracoes (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL,
  company_id UUID,
  nome TEXT NOT NULL,
  mensagem_boas_vindas TEXT NOT NULL,
  mensagem_menu TEXT NOT NULL,
  mensagem_despedida TEXT NOT NULL,
  tempo_resposta INTEGER DEFAULT 300,
  max_tentativas INTEGER DEFAULT 3,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔧 Exemplos de Uso

### Criar Conexão WhatsApp

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

### Obter QR Code

```bash
curl http://localhost:3001/api/whatsapp-integration/connections/minha-conexao-1/qr
```

### Enviar Mensagem

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

### Verificar Status

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

## 🔍 Troubleshooting

### Problemas Comuns

1. **Supabase Offline**
   ```bash
   # Verificar status
   curl http://localhost:3001/api/whatsapp-bootstrap/status
   
   # Verificar logs
   tail -f logs/combined.log
   ```

2. **Conexão WhatsApp Perdida**
   ```bash
   # Verificar conexões ativas
   curl http://localhost:3001/api/whatsapp-integration/connections
   
   # Reiniciar serviços
   curl -X POST http://localhost:3001/api/whatsapp-bootstrap/restart
   ```

3. **Mensagens Não Salvando**
   ```bash
   # Verificar fila de mensagens
   curl http://localhost:3001/api/whatsapp-integration/stats/supabase
   
   # Limpar fila se necessário
   curl -X POST http://localhost:3001/api/whatsapp-integration/queue/clear
   ```

### Logs Importantes

```bash
# Logs gerais
tail -f logs/combined.log

# Logs de erro
tail -f logs/error.log

# Logs do servidor
tail -f server.log
```

## 📊 Monitoramento

### URLs Úteis

- **Health Check**: `http://localhost:3001/health`
- **Status dos Serviços**: `http://localhost:3001/api/whatsapp-bootstrap/status`
- **Estatísticas**: `http://localhost:3001/api/whatsapp-bootstrap/stats`
- **Teste do Sistema**: `http://localhost:3001/api/whatsapp-bootstrap/test`

### Métricas Monitoradas

- Tempo de resposta do Supabase
- Tamanho da fila de mensagens
- Número de conexões ativas
- Taxa de sucesso de envio de mensagens
- Uptime dos serviços

## 🚨 Alertas e Eventos

O sistema emite eventos que podem ser monitorados:

- `connected` - Conexão estabelecida
- `disconnected` - Conexão perdida
- `messageReceived` - Mensagem recebida
- `messageSent` - Mensagem enviada
- `supabaseOffline` - Supabase offline
- `healthCheck` - Health check executado

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

## 📚 Documentação Adicional

- [Documentação Completa](./WHATSAPP_SUPABASE_INTEGRATION.md)
- [API Reference](./API_REFERENCE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
