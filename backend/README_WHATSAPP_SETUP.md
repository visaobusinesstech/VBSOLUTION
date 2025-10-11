# 🚀 Configuração do WhatsApp Baileys - Sistema Persistente

## 📋 Visão Geral

Este sistema garante que as conexões do WhatsApp sejam **SEMPRE** salvas no Supabase e que os QR codes sejam gerados **IMEDIATAMENTE** quando solicitados, evitando erros de conexão.

## 🎯 Características Principais

- ✅ **Persistência Robusta**: Todas as conexões são salvas no Supabase
- ✅ **QR Code Imediato**: Gerado automaticamente ao criar conexão
- ✅ **Reconexão Automática**: Restaura conexões após reinicialização
- ✅ **Retry Automático**: Sistema de tentativas para operações críticas
- ✅ **Multiplataforma**: Funciona em Windows, Linux e macOS

## 🚀 Inicialização Rápida

### Linux/macOS
```bash
cd backend
./start-whatsapp.sh
```

### Windows
```cmd
cd backend
start-whatsapp.bat
```

### Manual (qualquer sistema)
```bash
cd backend
node persistent-baileys-server.js
```

## 📁 Estrutura de Arquivos

```
backend/
├── persistent-baileys-server.js    # Servidor principal com persistência
├── start-whatsapp.sh              # Script de inicialização (Linux/macOS)
├── start-whatsapp.bat             # Script de inicialização (Windows)
├── backup-whatsapp-config.js      # Sistema de backup automático
├── env.supabase                   # Configurações do Supabase
├── auth_info/                     # Dados de autenticação (criado automaticamente)
├── backups/                       # Backups automáticos (criado automaticamente)
└── logs/                          # Logs do sistema (criado automaticamente)
```

## ⚙️ Configuração

### 1. Configurar Supabase
Edite o arquivo `env.supabase` com suas credenciais:

```env
SUPABASE_URL=https://nrbsocawokmihvxfcpso.supabase.co
SUPABASE_ANON_KEY=sua_chave_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
JWT_SECRET=seu_jwt_secret_aqui
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Executar Scripts de Schema (se necessário)
```bash
psql "postgresql://postgres:senha@db.nrbsocawokmihvxfcpso.supabase.co:5432/postgres" -f fix_whatsapp_sessions_schema.sql
psql "postgresql://postgres:senha@db.nrbsocawokmihvxfcpso.supabase.co:5432/postgres" -f fix_whatsapp_atendimentos_schema.sql
```

## 🔧 Uso do Sistema

### Criar Nova Conexão
```javascript
// O QR code será gerado automaticamente
const response = await fetch('/api/baileys-simple/connections', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Minha Conexão',
    type: 'whatsapp_baileys'
  })
});

const result = await response.json();
// result.data.qrCode já contém o QR code!
```

### Obter QR Code
```javascript
const response = await fetch(`/api/baileys-simple/connections/${connectionId}/qr`);
const result = await response.json();
// result.data.qrCode contém o QR code atual
```

### Listar Conexões
```javascript
const response = await fetch('/api/baileys-simple/connections');
const result = await response.json();
// result.data contém todas as conexões conectadas
```

## 💾 Sistema de Backup

### Criar Backup
```bash
node backup-whatsapp-config.js create
```

### Restaurar Backup
```bash
node backup-whatsapp-config.js restore backup-file.json
```

### Listar Backups
```bash
node backup-whatsapp-config.js list
```

### Verificar Integridade
```bash
node backup-whatsapp-config.js verify backup-file.json
```

## 🔍 Monitoramento

### Health Check
```bash
curl http://localhost:3000/api/baileys-simple/health
```

### Logs em Tempo Real
```bash
tail -f logs/whatsapp-persistence.log
```

## 🛠️ Solução de Problemas

### Erro: "Conexão não encontrada"
- Verifique se o servidor está rodando
- Confirme se a connectionId está correto
- Verifique os logs do servidor

### Erro: "QR Code não gerado"
- Aguarde alguns segundos (o QR code é gerado automaticamente)
- Verifique se o Baileys foi importado corretamente
- Confirme se as credenciais do Supabase estão corretas

### Erro: "Falha na persistência"
- Verifique a conexão com o Supabase
- Confirme se as tabelas existem
- Execute os scripts de schema se necessário

### Porta 3000 em uso
```bash
# Linux/macOS
pkill -f "persistent-baileys-server.js"

# Windows
taskkill /f /im node.exe
```

## 📊 Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/baileys-simple/health` | Status do servidor |
| GET | `/api/baileys-simple/connections` | Listar conexões |
| POST | `/api/baileys-simple/connections` | Criar nova conexão |
| GET | `/api/baileys-simple/connections/:id/qr` | Obter QR code |
| GET | `/api/baileys-simple/connections/:id/info` | Informações da conexão |
| DELETE | `/api/baileys-simple/connections/:id` | Deletar conexão |

## 🔐 Segurança

- ✅ RLS (Row Level Security) ativado no Supabase
- ✅ Isolamento de dados por usuário
- ✅ Validação de entrada em todos os endpoints
- ✅ Retry automático para operações críticas
- ✅ Backup automático das configurações

## 📈 Performance

- ✅ Conexões persistentes no Supabase
- ✅ Cache de QR codes na memória
- ✅ Renovação automática de QR codes
- ✅ Reconexão automática após falhas
- ✅ Limite de 5 conexões por usuário

## 🆘 Suporte

### Logs Importantes
- `📱 QR Code gerado` - QR code criado com sucesso
- `✅ Conectado ao WhatsApp` - Conexão estabelecida
- `💾 Sessão salva` - Dados salvos no Supabase
- `❌ Erro ao salvar` - Falha na persistência

### Comandos de Emergência
```bash
# Parar servidor
pkill -f "persistent-baileys-server.js"

# Limpar conexões antigas
node backup-whatsapp-config.js cleanup

# Verificar status
curl http://localhost:3000/api/baileys-simple/health
```

## 📝 Changelog

### v2.0.0 - Sistema Persistente
- ✅ Persistência robusta no Supabase
- ✅ QR code gerado imediatamente
- ✅ Reconexão automática
- ✅ Sistema de backup
- ✅ Scripts multiplataforma

### v1.0.0 - Versão Inicial
- ✅ Integração básica com Baileys
- ✅ Geração de QR codes
- ✅ Conexões em memória

---

## 🎯 Resumo

Este sistema foi projetado para **NUNCA PERDER** as configurações do WhatsApp. O QR code é gerado **IMEDIATAMENTE** ao criar uma conexão, evitando erros como "Erro ao conectar com Baileys".

**Para usar**: Execute `./start-whatsapp.sh` (Linux/macOS) ou `start-whatsapp.bat` (Windows) e o sistema estará pronto!

---
*Última atualização: 2025-01-12*
*Versão: 2.0.0-persistent*
