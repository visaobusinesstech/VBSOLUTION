# 🛡️ PROTEÇÃO DO SISTEMA DE PERSISTÊNCIA WHATSAPP

## ⚠️ AVISO CRÍTICO - NÃO MODIFICAR SEM AUTORIZAÇÃO

Este documento define as regras de proteção para o sistema de persistência do WhatsApp Baileys. **QUALQUER MODIFICAÇÃO** nos arquivos listados abaixo **DEVE** ser aprovada e documentada.

## 📋 ARQUIVOS PROTEGIDOS

### 1. **persistent-baileys-server.js** - SERVIDOR PRINCIPAL
- **Status**: 🔒 PROTEGIDO
- **Função**: Servidor principal com sistema de persistência robusta
- **Modificações permitidas**: Apenas correções de bugs críticos
- **Aprovação necessária**: ✅ SIM

### 2. **fix_whatsapp_sessions_schema.sql** - SCHEMA DE SESSÕES
- **Status**: 🔒 PROTEGIDO
- **Função**: Define a estrutura da tabela whatsapp_sessions
- **Modificações permitidas**: Apenas adição de colunas (nunca remoção)
- **Aprovação necessária**: ✅ SIM

### 3. **fix_whatsapp_atendimentos_schema.sql** - SCHEMA DE ATENDIMENTOS
- **Status**: 🔒 PROTEGIDO
- **Função**: Define a estrutura da tabela whatsapp_atendimentos
- **Modificações permitidas**: Apenas adição de colunas (nunca remoção)
- **Aprovação necessária**: ✅ SIM

## 🎯 PRINCÍPIOS FUNDAMENTAIS

### 1. **PERSISTÊNCIA OBRIGATÓRIA**
- ✅ TODAS as conexões DEVEM ser salvas na tabela `whatsapp_sessions`
- ✅ NUNCA confiar apenas na memória do servidor
- ✅ SEMPRE usar retry automático para operações críticas
- ✅ SEMPRE manter backup das configurações

### 2. **ISOLAMENTO DE DADOS**
- ✅ Cada usuário vê apenas suas próprias conexões
- ✅ Usar `owner_id` para isolar dados
- ✅ Implementar RLS (Row Level Security) no Supabase

### 3. **RECUPERAÇÃO AUTOMÁTICA**
- ✅ Servidor deve reconectar sessões existentes ao iniciar
- ✅ QR codes devem ser regenerados automaticamente
- ✅ Status deve ser sincronizado entre memória e banco

## 🔧 CONFIGURAÇÕES OBRIGATÓRIAS

### Tabela `whatsapp_sessions` - ESTRUTURA MÍNIMA
```sql
CREATE TABLE whatsapp_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    session_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'disconnected',
    connection_id VARCHAR(255) UNIQUE NOT NULL,
    qr_code TEXT,
    phone_number VARCHAR(20),
    whatsapp_id VARCHAR(255),
    whatsapp_info JSONB,
    connected_at TIMESTAMP WITH TIME ZONE,
    disconnected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duplicate_reason VARCHAR(100)
);
```

### Tabela `whatsapp_atendimentos` - ESTRUTURA MÍNIMA
```sql
CREATE TABLE whatsapp_atendimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ATIVO',
    owner_id UUID NOT NULL,
    connection_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚨 REGRAS DE PROTEÇÃO

### ❌ NUNCA FAZER
1. **Remover colunas** das tabelas protegidas
2. **Alterar tipos** de colunas críticas (connection_id, owner_id)
3. **Desabilitar RLS** nas tabelas
4. **Remover retry automático** do sistema de persistência
5. **Alterar estrutura** dos eventos Socket.IO
6. **Modificar lógica** de reconexão automática

### ✅ SEMPRE FAZER
1. **Testar** todas as modificações em ambiente de desenvolvimento
2. **Documentar** qualquer alteração nos arquivos protegidos
3. **Manter compatibilidade** com versões anteriores
4. **Validar** que as conexões são salvas corretamente
5. **Verificar** que o QR code é gerado e exibido
6. **Confirmar** que as mensagens são processadas

## 🔄 PROCESSO DE ATUALIZAÇÃO

### Para Modificações Menores (Correções de Bugs)
1. ✅ Criar branch `fix/whatsapp-persistence-[descrição]`
2. ✅ Implementar correção
3. ✅ Testar em ambiente de desenvolvimento
4. ✅ Validar que persistência continua funcionando
5. ✅ Criar PR com descrição detalhada
6. ✅ Aguardar aprovação de 2 desenvolvedores

### Para Modificações Maiores (Novas Funcionalidades)
1. ✅ Criar branch `feature/whatsapp-persistence-[descrição]`
2. ✅ Documentar impacto na persistência
3. ✅ Implementar com fallback para versão anterior
4. ✅ Testar extensivamente
5. ✅ Criar PR com documentação completa
6. ✅ Aguardar aprovação de 3 desenvolvedores + tech lead

## 🧪 TESTES OBRIGATÓRIOS

### Teste de Persistência
```bash
# 1. Criar conexão
curl -X POST http://localhost:3000/api/baileys-simple/connections

# 2. Verificar se foi salva no Supabase
# 3. Reiniciar servidor
# 4. Verificar se conexão foi restaurada
```

### Teste de QR Code
```bash
# 1. Obter QR code
curl http://localhost:3000/api/baileys-simple/connections/[ID]/qr

# 2. Verificar se QR code é válido
# 3. Verificar se é exibido no frontend
```

### Teste de Reconexão
```bash
# 1. Conectar WhatsApp
# 2. Reiniciar servidor
# 3. Verificar se conexão foi restaurada
# 4. Verificar se mensagens continuam funcionando
```

## 📊 MONITORAMENTO

### Métricas Obrigatórias
- ✅ Número de conexões ativas
- ✅ Taxa de sucesso na persistência
- ✅ Tempo de reconexão após restart
- ✅ Erros de persistência
- ✅ QR codes gerados com sucesso

### Alertas Críticos
- 🚨 Falha na persistência > 5%
- 🚨 Tempo de reconexão > 30 segundos
- 🚨 Erro ao gerar QR code
- 🚨 Perda de conexões após restart

## 🔐 BACKUP E RECUPERAÇÃO

### Backup Automático
- ✅ Backup diário das tabelas protegidas
- ✅ Backup antes de qualquer atualização
- ✅ Versionamento das configurações

### Recuperação de Emergência
1. ✅ Restaurar backup mais recente
2. ✅ Verificar integridade dos dados
3. ✅ Reiniciar servidor
4. ✅ Validar funcionamento

## 📝 LOG DE ALTERAÇÕES

| Data | Versão | Alteração | Aprovado por | Status |
|------|--------|-----------|--------------|--------|
| 2025-01-12 | 1.0.0 | Criação do sistema de persistência | - | ✅ Ativo |
| 2025-01-12 | 1.1.0 | Adição de retry automático | - | ✅ Ativo |

## 🆘 CONTATOS DE EMERGÊNCIA

- **Tech Lead**: [Nome] - [Email] - [Telefone]
- **DevOps**: [Nome] - [Email] - [Telefone]
- **DBA**: [Nome] - [Email] - [Telefone]

## ⚡ COMANDOS DE EMERGÊNCIA

### Verificar Status do Sistema
```bash
curl http://localhost:3000/api/baileys-simple/health
```

### Forçar Reconexão de Todas as Sessões
```bash
# Reiniciar servidor
pm2 restart persistent-baileys-server
```

### Verificar Logs de Persistência
```bash
tail -f /var/log/whatsapp-persistence.log
```

---

## 🎯 RESUMO EXECUTIVO

Este sistema de persistência foi projetado para **NUNCA PERDER** as configurações do WhatsApp. Qualquer modificação deve ser feita com extrema cautela e sempre testada antes de ser aplicada em produção.

**LEMBRE-SE**: A confiabilidade do sistema depende da integridade destes arquivos. Modificações não autorizadas podem resultar em perda de dados e interrupção do serviço.

---
*Última atualização: 2025-01-12*
*Versão do documento: 1.0.0*
