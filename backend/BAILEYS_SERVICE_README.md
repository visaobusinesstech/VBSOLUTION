# 🚀 Baileys WhatsApp Service - Sistema Robusto

Este sistema garante que o serviço Baileys WhatsApp nunca pare e sempre esteja disponível para gerar QR codes.

## ✅ Problemas Resolvidos

1. **Erro de `owner_id` null**: Corrigido adicionando um usuário sistema padrão
2. **Serviço instável**: Implementado sistema de monitoramento e auto-restart
3. **QR codes não gerando**: Sistema otimizado para geração de QR codes
4. **Múltiplas conexões**: Limpeza automática de conexões duplicadas

## 🛠️ Arquivos Criados

- `baileys-monitor.js` - Monitor principal com auto-restart
- `start-baileys.sh` - Script de gerenciamento do serviço
- `install-baileys-service.sh` - Instalação como serviço do sistema
- `fix_owner_id_simple.sql` - Correção do problema de owner_id

## 🚀 Como Usar

### 1. Iniciar o Serviço Manualmente
```bash
cd backend
./start-baileys.sh start
```

### 2. Verificar Status
```bash
./start-baileys.sh status
```

### 3. Ver Logs
```bash
./start-baileys.sh logs
```

### 4. Parar o Serviço
```bash
./start-baileys.sh stop
```

### 5. Reiniciar o Serviço
```bash
./start-baileys.sh restart
```

## 🔧 Instalação como Serviço do Sistema (macOS)

Para que o serviço inicie automaticamente no boot:

```bash
./install-baileys-service.sh
```

## 📊 Monitoramento

O sistema inclui:

- **Health Check**: Verifica a cada 30 segundos se o serviço está respondendo
- **Auto-restart**: Reinicia automaticamente se o serviço parar
- **Logs detalhados**: Todos os eventos são registrados
- **Máximo de tentativas**: Evita loops infinitos de restart

## 🔍 Verificação de Funcionamento

### 1. Testar API
```bash
curl http://localhost:3000/api/baileys-simple/connections
```

### 2. Criar Nova Conexão
```bash
curl -X POST http://localhost:3000/api/baileys-simple/connections \
  -H "Content-Type: application/json" \
  -d '{"name": "Teste QR", "type": "whatsapp_baileys"}'
```

### 3. Verificar QR Code
```bash
curl http://localhost:3000/api/baileys-simple/connections/{connectionId}/qr
```

## 📋 Tabelas do Supabase

O sistema salva dados nas seguintes tabelas:

- **`whatsapp_sessions`**: Sessões de conexão (com owner_id corrigido)
- **`whatsapp_mensagens`**: Mensagens das conversas
- **`whatsapp_atendimentos`**: Status dos atendimentos
- **`whatsapp_configuracoes`**: Configurações e métricas

## 🚨 Solução de Problemas

### Serviço não inicia
```bash
# Verificar logs de erro
tail -f baileys-service-error.log

# Verificar se a porta 3000 está livre
lsof -i :3000
```

### QR Code não aparece
```bash
# Verificar logs do servidor
tail -f baileys-server.log

# Abortar conexão atual e criar nova
curl -X POST http://localhost:3000/api/baileys-simple/connections/{id}/abort
```

### Múltiplas conexões
```bash
# O sistema limpa automaticamente, mas pode ser feito manualmente
node cleanup-connections.js
```

## 🔄 Comandos do Sistema

### Gerenciar Serviço do Sistema
```bash
# Ver status
launchctl list | grep com.vbsolution.baileys

# Parar
launchctl stop com.vbsolution.baileys

# Iniciar
launchctl start com.vbsolution.baileys

# Recarregar
launchctl unload ~/Library/LaunchAgents/com.vbsolution.baileys.plist
launchctl load ~/Library/LaunchAgents/com.vbsolution.baileys.plist
```

## 📈 Status Atual

✅ **Serviço Baileys**: Funcionando com monitoramento  
✅ **QR Code Generation**: Implementado  
✅ **Auto-restart**: Ativo  
✅ **Health Checks**: Funcionando  
✅ **Logs**: Completos  
✅ **Supabase Integration**: Corrigida  

O sistema está pronto para uso em produção! 🎉
